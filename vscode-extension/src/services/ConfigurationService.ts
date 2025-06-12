import * as vscode from 'vscode';
import { ExtensionConfig } from '../types';
import { ConfigValidator, ValidationResult } from '../utils/ConfigValidator';

export class ConfigurationService {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('projectMaster');
    }

    updateConfiguration(): void {
        this.config = vscode.workspace.getConfiguration('projectMaster');
    }

    getConfig(): ExtensionConfig {
        return {
            apiUrl: this.config.get<string>('apiUrl', 'http://localhost:8080'),
            apiKey: this.config.get<string>('apiKey', ''),
            webUrl: this.config.get<string>('webUrl', 'http://localhost:3000'),
            autoRefresh: this.config.get<boolean>('autoRefresh', true),
            refreshInterval: this.config.get<number>('refreshInterval', 30000),
            defaultProject: this.config.get<string>('defaultProject', ''),
            enableNotifications: this.config.get<boolean>('enableNotifications', true),
            logLevel: this.config.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info')
        };
    }

    getApiUrl(): string {
        return this.config.get<string>('apiUrl', 'http://localhost:8080');
    }

    getApiKey(): string {
        return this.config.get<string>('apiKey', '');
    }

    getWebUrl(): string {
        return this.config.get<string>('webUrl', 'http://localhost:3000');
    }

    getAutoRefresh(): boolean {
        return this.config.get<boolean>('autoRefresh', true);
    }

    getRefreshInterval(): number {
        return this.config.get<number>('refreshInterval', 30000);
    }

    getDefaultProject(): string {
        return this.config.get<string>('defaultProject', '');
    }

    getEnableNotifications(): boolean {
        return this.config.get<boolean>('enableNotifications', true);
    }

    getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
        return this.config.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info');
    }

    isConfigured(): boolean {
        const apiUrl = this.getApiUrl();
        return apiUrl !== '' && apiUrl !== 'http://localhost:8080' || this.getApiKey() !== '';
    }

    async setApiUrl(url: string): Promise<void> {
        await this.config.update('apiUrl', url, vscode.ConfigurationTarget.Global);
    }

    async setApiKey(key: string): Promise<void> {
        await this.config.update('apiKey', key, vscode.ConfigurationTarget.Global);
    }

    async setWebUrl(url: string): Promise<void> {
        await this.config.update('webUrl', url, vscode.ConfigurationTarget.Global);
    }

    async setDefaultProject(projectId: string): Promise<void> {
        await this.config.update('defaultProject', projectId, vscode.ConfigurationTarget.Global);
    }

    async setAutoRefresh(enabled: boolean): Promise<void> {
        await this.config.update('autoRefresh', enabled, vscode.ConfigurationTarget.Global);
    }

    async setRefreshInterval(interval: number): Promise<void> {
        await this.config.update('refreshInterval', interval, vscode.ConfigurationTarget.Global);
    }

    async setEnableNotifications(enabled: boolean): Promise<void> {
        await this.config.update('enableNotifications', enabled, vscode.ConfigurationTarget.Global);
    }

    async setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): Promise<void> {
        await this.config.update('logLevel', level, vscode.ConfigurationTarget.Global);
    }

    // Validation methods
    validateConfiguration(): ValidationResult {
        return ConfigValidator.validateConfig(this.getConfig());
    }

    async validateAndPromptFix(): Promise<boolean> {
        return await ConfigValidator.validateAndPromptFix(this.getConfig());
    }

    getConfigurationStatus(): string {
        return ConfigValidator.getConfigurationStatus(this.getConfig());
    }

    isProductionConfiguration(): boolean {
        return ConfigValidator.isProductionConfig(this.getConfig());
    }

    getRecommendedSettings(): Partial<ExtensionConfig> {
        return ConfigValidator.getRecommendedSettings();
    }

    async applyRecommendedSettings(): Promise<void> {
        const recommended = this.getRecommendedSettings();
        
        if (recommended.autoRefresh !== undefined) {
            await this.setAutoRefresh(recommended.autoRefresh);
        }
        if (recommended.refreshInterval !== undefined) {
            await this.setRefreshInterval(recommended.refreshInterval);
        }
        if (recommended.enableNotifications !== undefined) {
            await this.setEnableNotifications(recommended.enableNotifications);
        }
        if (recommended.logLevel !== undefined) {
            await this.setLogLevel(recommended.logLevel);
        }
    }
} 