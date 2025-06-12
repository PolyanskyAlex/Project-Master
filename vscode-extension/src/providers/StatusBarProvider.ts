import * as vscode from 'vscode';
import { ConfigurationService } from '../services/ConfigurationService';
import { ApiService } from '../services/ApiService';
import { Logger } from '../utils/Logger';

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;
    private configService: ConfigurationService;
    private apiService: ApiService;
    private logger: Logger;
    private refreshTimer?: NodeJS.Timeout;

    constructor(configService: ConfigurationService, apiService: ApiService, logger: Logger) {
        this.configService = configService;
        this.apiService = apiService;
        this.logger = logger;
        
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'projectMaster.showStatus';
        this.updateStatus();
        this.statusBarItem.show();
        
        // Auto-refresh status
        this.startAutoRefresh();
    }

    private startAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Refresh every 30 seconds
        this.refreshTimer = setInterval(() => {
            this.updateStatus();
        }, 30000);
    }

    private async updateStatus(): Promise<void> {
        try {
            const configStatus = this.configService.getConfigurationStatus();
            const isConfigured = this.configService.isConfigured();
            
            if (!isConfigured) {
                this.statusBarItem.text = '$(warning) Project Master: Not Configured';
                this.statusBarItem.tooltip = 'Click to configure Project Master extension';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                this.statusBarItem.command = 'projectMaster.setupWizard';
                return;
            }

            // Test API connection
            let connectionStatus = '$(loading~spin)';
            let tooltip = 'Testing connection...';
            
            try {
                const isHealthy = await this.apiService.healthCheck();
                if (isHealthy) {
                    connectionStatus = '$(check)';
                    tooltip = 'Connected to Project Master API';
                    this.statusBarItem.backgroundColor = undefined;
                } else {
                    connectionStatus = '$(error)';
                    tooltip = 'Cannot connect to Project Master API';
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                }
            } catch (error) {
                connectionStatus = '$(error)';
                tooltip = `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            }

            this.statusBarItem.text = `${connectionStatus} Project Master`;
            this.statusBarItem.tooltip = `${tooltip}\n\nConfiguration: ${configStatus}\nClick for more options`;
            this.statusBarItem.command = 'projectMaster.showStatus';

        } catch (error) {
            this.logger.error('Failed to update status bar', error);
            this.statusBarItem.text = '$(error) Project Master: Error';
            this.statusBarItem.tooltip = 'Error updating status. Check logs for details.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    async showStatusMenu(): Promise<void> {
        const configStatus = this.configService.getConfigurationStatus();
        const isConfigured = this.configService.isConfigured();
        const isProduction = this.configService.isProductionConfiguration();

        const items: vscode.QuickPickItem[] = [];

        // Configuration status
        items.push({
            label: `$(gear) Configuration Status: ${configStatus}`,
            description: isProduction ? 'Production' : 'Development',
            detail: 'Current configuration status'
        });

        items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });

        // Setup options
        if (!isConfigured) {
            items.push({
                label: '$(zap) Quick Setup',
                description: 'Configure with default settings',
                detail: 'Set up for local development'
            });
        }

        items.push({
            label: '$(gear) Setup Wizard',
            description: 'Step-by-step configuration',
            detail: 'Configure all settings with guidance'
        });

        items.push({
            label: '$(plug) Test Connection',
            description: 'Check API connectivity',
            detail: 'Verify connection to Project Master API'
        });

        items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });

        // Quick actions
        items.push({
            label: '$(browser) Open Web UI',
            description: 'Open Project Master in browser',
            detail: 'Launch the web interface'
        });

        items.push({
            label: '$(refresh) Refresh Data',
            description: 'Update projects and tasks',
            detail: 'Refresh all cached data'
        });

        items.push({
            label: '$(settings-gear) Open Settings',
            description: 'VS Code settings',
            detail: 'Open Project Master settings'
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Project Master - Choose an action',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Handle selection
        switch (selected.label) {
            case '$(zap) Quick Setup':
                await vscode.commands.executeCommand('projectMaster.quickSetup');
                break;
            case '$(gear) Setup Wizard':
                await vscode.commands.executeCommand('projectMaster.setupWizard');
                break;
            case '$(plug) Test Connection':
                await vscode.commands.executeCommand('projectMaster.testConnection');
                break;
            case '$(browser) Open Web UI':
                await vscode.commands.executeCommand('projectMaster.openWebUI');
                break;
            case '$(refresh) Refresh Data':
                await vscode.commands.executeCommand('projectMaster.refreshProjects');
                break;
            case '$(settings-gear) Open Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                break;
        }

        // Refresh status after action
        setTimeout(() => this.updateStatus(), 1000);
    }

    onConfigurationChanged(): void {
        this.logger.info('Configuration changed, updating status...');
        this.updateStatus();
    }

    dispose(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.statusBarItem.dispose();
    }
} 