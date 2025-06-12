import * as vscode from 'vscode';
import { ExtensionConfig } from '../types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class ConfigValidator {
    static validateConfig(config: ExtensionConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate API URL
        if (!config.apiUrl) {
            errors.push('API URL is required');
        } else {
            try {
                const url = new URL(config.apiUrl);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    errors.push('API URL must use HTTP or HTTPS protocol');
                }
                if (url.hostname === 'localhost' && url.port === '8080') {
                    warnings.push('Using default localhost API URL - make sure your backend is running');
                }
            } catch {
                errors.push('API URL is not a valid URL');
            }
        }

        // Validate Web URL
        if (!config.webUrl) {
            errors.push('Web UI URL is required');
        } else {
            try {
                const url = new URL(config.webUrl);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    errors.push('Web UI URL must use HTTP or HTTPS protocol');
                }
                if (url.hostname === 'localhost' && url.port === '3000') {
                    warnings.push('Using default localhost Web UI URL - make sure your frontend is running');
                }
            } catch {
                errors.push('Web UI URL is not a valid URL');
            }
        }

        // Validate refresh interval
        if (config.refreshInterval < 5000) {
            warnings.push('Refresh interval is very low (< 5 seconds) - this may impact performance');
        }
        if (config.refreshInterval > 300000) {
            warnings.push('Refresh interval is very high (> 5 minutes) - data may be stale');
        }

        // Validate log level
        const validLogLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLogLevels.includes(config.logLevel)) {
            errors.push(`Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
        }

        // API Key warnings
        if (!config.apiKey) {
            warnings.push('No API key configured - authentication may be required for some APIs');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    static async showValidationResults(result: ValidationResult): Promise<void> {
        if (!result.isValid) {
            const errorMessage = `Configuration errors:\n${result.errors.join('\n')}`;
            await vscode.window.showErrorMessage(errorMessage, 'Open Settings');
        } else if (result.warnings.length > 0) {
            const warningMessage = `Configuration warnings:\n${result.warnings.join('\n')}`;
            await vscode.window.showWarningMessage(warningMessage, 'OK', 'Open Settings');
        } else {
            await vscode.window.showInformationMessage('Configuration is valid!');
        }
    }

    static async validateAndPromptFix(config: ExtensionConfig): Promise<boolean> {
        const result = this.validateConfig(config);
        
        if (!result.isValid) {
            const action = await vscode.window.showErrorMessage(
                `Configuration has errors:\n${result.errors.join('\n')}\n\nWould you like to run the setup wizard?`,
                'Setup Wizard',
                'Open Settings',
                'Ignore'
            );

            switch (action) {
                case 'Setup Wizard':
                    await vscode.commands.executeCommand('projectMaster.setupWizard');
                    return false;
                case 'Open Settings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                    return false;
                default:
                    return false;
            }
        }

        if (result.warnings.length > 0) {
            const action = await vscode.window.showWarningMessage(
                `Configuration warnings:\n${result.warnings.join('\n')}`,
                'OK',
                'Setup Wizard'
            );

            if (action === 'Setup Wizard') {
                await vscode.commands.executeCommand('projectMaster.setupWizard');
            }
        }

        return true;
    }

    static getConfigurationStatus(config: ExtensionConfig): string {
        const result = this.validateConfig(config);
        
        if (!result.isValid) {
            return '❌ Invalid Configuration';
        }
        
        if (result.warnings.length > 0) {
            return '⚠️ Configuration Warnings';
        }
        
        return '✅ Configuration Valid';
    }

    static isProductionConfig(config: ExtensionConfig): boolean {
        try {
            const apiUrl = new URL(config.apiUrl);
            const webUrl = new URL(config.webUrl);
            
            return !(
                (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1') &&
                (webUrl.hostname === 'localhost' || webUrl.hostname === '127.0.0.1')
            );
        } catch {
            return false;
        }
    }

    static getRecommendedSettings(): Partial<ExtensionConfig> {
        return {
            autoRefresh: true,
            refreshInterval: 30000,
            enableNotifications: true,
            logLevel: 'info'
        };
    }
}
