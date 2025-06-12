import * as vscode from 'vscode';
import { CachedApiService } from '../services/CachedApiService';
import { Logger } from '../utils/Logger';

/**
 * Команды для управления кэшем
 */
export class CacheCommands {
    private logger: Logger;

    constructor(private cachedApiService: CachedApiService) {
        this.logger = new Logger();
    }

    /**
     * Регистрация команд кэша
     */
    public registerCommands(context: vscode.ExtensionContext): void {
        const commands = [
            vscode.commands.registerCommand('projectMaster.cache.showStats', () => this.showCacheStats()),
            vscode.commands.registerCommand('projectMaster.cache.clear', () => this.clearCache()),
            vscode.commands.registerCommand('projectMaster.cache.preload', () => this.preloadCache()),
            vscode.commands.registerCommand('projectMaster.cache.export', () => this.exportCache()),
            vscode.commands.registerCommand('projectMaster.cache.manage', () => this.manageCacheDialog())
        ];

        commands.forEach(command => {
            context.subscriptions.push(command);
        });

        this.logger.info('Cache commands registered');
    }

    /**
     * Показать статистику кэша
     */
    private async showCacheStats(): Promise<void> {
        try {
            const stats = this.cachedApiService.getCacheStats();
            
            const statsContent = `# Cache Statistics

## Performance Metrics
- **Hit Rate:** ${stats.hitRate.toFixed(2)}%
- **Total Requests:** ${stats.totalRequests}
- **Cache Hits:** ${stats.hits}
- **Cache Misses:** ${stats.misses}

## Memory Usage
- **Cache Size:** ${stats.size} entries
- **Memory Usage:** ${this.formatBytes(stats.memoryUsage)}

## Efficiency Analysis
${this.generateEfficiencyAnalysis(stats)}

---
*Statistics generated at ${new Date().toLocaleString()}*`;

            const doc = await vscode.workspace.openTextDocument({
                content: statsContent,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside
            });

            this.logger.info('Cache statistics displayed');

        } catch (error) {
            this.logger.error('Failed to show cache statistics', error);
            vscode.window.showErrorMessage(`Failed to show cache statistics: ${error}`);
        }
    }

    /**
     * Очистить кэш
     */
    private async clearCache(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'Are you sure you want to clear the cache? This will remove all cached data and may temporarily slow down the extension.',
                { modal: true },
                'Clear Cache',
                'Cancel'
            );

            if (confirmation !== 'Clear Cache') {
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Clearing cache...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Clearing cache entries...' });
                
                this.cachedApiService.clearCache();
                
                progress.report({ increment: 100, message: 'Cache cleared!' });
            });

            vscode.window.showInformationMessage('Cache cleared successfully.');

        } catch (error) {
            this.logger.error('Failed to clear cache', error);
            vscode.window.showErrorMessage(`Failed to clear cache: ${error}`);
        }
    }

    /**
     * Предварительная загрузка кэша
     */
    private async preloadCache(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Preloading cache...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Loading data into cache...' });
                
                await this.cachedApiService.preloadCache();
                
                progress.report({ increment: 100, message: 'Cache preloaded!' });
            });

            const stats = this.cachedApiService.getCacheStats();
            vscode.window.showInformationMessage(
                `Cache preloaded successfully. ${stats.size} entries cached.`,
                'View Statistics'
            ).then(selection => {
                if (selection === 'View Statistics') {
                    vscode.commands.executeCommand('projectMaster.cache.showStats');
                }
            });

        } catch (error) {
            this.logger.error('Failed to preload cache', error);
            vscode.window.showErrorMessage(`Failed to preload cache: ${error}`);
        }
    }

    /**
     * Экспорт кэша для отладки
     */
    private async exportCache(): Promise<void> {
        try {
            const cacheData = this.cachedApiService.exportCache();
            
            const exportContent = JSON.stringify(cacheData, null, 2);
            
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`cache-export-${Date.now()}.json`),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                title: 'Export Cache Data'
            });

            if (!saveUri) {
                return;
            }

            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(exportContent, 'utf8'));

            const document = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Cache exported to: ${saveUri.fsPath}`);

        } catch (error) {
            this.logger.error('Failed to export cache', error);
            vscode.window.showErrorMessage(`Failed to export cache: ${error}`);
        }
    }

    /**
     * Диалог управления кэшем
     */
    private async manageCacheDialog(): Promise<void> {
        try {
            const stats = this.cachedApiService.getCacheStats();
            
            const action = await vscode.window.showQuickPick([
                {
                    label: '$(graph) View Statistics',
                    description: `Hit rate: ${stats.hitRate.toFixed(1)}%, Size: ${stats.size} entries`,
                    detail: 'Show detailed cache performance statistics',
                    action: 'stats'
                },
                {
                    label: '$(refresh) Preload Cache',
                    description: 'Load frequently used data into cache',
                    detail: 'Improves performance by caching common data',
                    action: 'preload'
                },
                {
                    label: '$(trash) Clear Cache',
                    description: 'Remove all cached data',
                    detail: 'Frees memory but may temporarily slow down operations',
                    action: 'clear'
                },
                {
                    label: '$(export) Export Cache',
                    description: 'Save cache data to file for debugging',
                    detail: 'Useful for troubleshooting cache issues',
                    action: 'export'
                },
                {
                    label: '$(settings-gear) Cache Settings',
                    description: 'Configure cache behavior',
                    detail: 'Adjust cache size, TTL, and other settings',
                    action: 'settings'
                }
            ], {
                placeHolder: 'Select cache management action',
                matchOnDescription: true
            });

            if (!action) {
                return;
            }

            switch (action.action) {
                case 'stats':
                    await this.showCacheStats();
                    break;
                case 'preload':
                    await this.preloadCache();
                    break;
                case 'clear':
                    await this.clearCache();
                    break;
                case 'export':
                    await this.exportCache();
                    break;
                case 'settings':
                    await this.openCacheSettings();
                    break;
            }

        } catch (error) {
            this.logger.error('Failed to show cache management dialog', error);
            vscode.window.showErrorMessage(`Failed to show cache management: ${error}`);
        }
    }

    /**
     * Открыть настройки кэша
     */
    private async openCacheSettings(): Promise<void> {
        try {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster.cache');
        } catch (error) {
            this.logger.error('Failed to open cache settings', error);
            vscode.window.showErrorMessage('Failed to open cache settings.');
        }
    }

    // Вспомогательные методы

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private generateEfficiencyAnalysis(stats: any): string {
        let analysis = '';
        
        if (stats.hitRate >= 80) {
            analysis += '✅ **Excellent** - Cache is performing very well\n';
        } else if (stats.hitRate >= 60) {
            analysis += '⚠️ **Good** - Cache performance is acceptable\n';
        } else if (stats.hitRate >= 40) {
            analysis += '⚠️ **Fair** - Consider preloading more data\n';
        } else {
            analysis += '❌ **Poor** - Cache may need optimization\n';
        }

        if (stats.size > 800) {
            analysis += '⚠️ Cache is getting large, consider clearing old entries\n';
        }

        if (stats.totalRequests < 10) {
            analysis += 'ℹ️ Not enough data for accurate analysis\n';
        }

        return analysis || 'ℹ️ Cache is operating normally';
    }
} 