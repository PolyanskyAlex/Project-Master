import * as vscode from "vscode";
import { ConfigurationService } from '../services/ConfigurationService';
import { ApiService } from '../services/ApiService';
import { Logger } from '../utils/Logger';

export class SetupCommands {
    constructor(
        private configService: ConfigurationService,
        private apiService: ApiService,
        private logger: Logger
    ) {}

    registerCommands(context: vscode.ExtensionContext): void {
        // Setup Wizard Command
        const setupWizardCommand = vscode.commands.registerCommand('projectMaster.setupWizard', async () => {
            await this.runSetupWizard();
        });

        // Test Connection Command
        const testConnectionCommand = vscode.commands.registerCommand('projectMaster.testConnection', async () => {
            await this.testConnection();
        });

        // Quick Setup Command
        const quickSetupCommand = vscode.commands.registerCommand('projectMaster.quickSetup', async () => {
            await this.quickSetup();
        });

        context.subscriptions.push(
            setupWizardCommand,
            testConnectionCommand,
            quickSetupCommand
        );

        this.logger.info('Setup commands registered successfully');
    }

    private async runSetupWizard(): Promise<void> {
        this.logger.info('Starting setup wizard...');

        try {
            // Welcome message
            const proceed = await vscode.window.showInformationMessage(
                'Welcome to Project Master Setup Wizard! This will help you configure the extension.',
                'Continue',
                'Cancel'
            );

            if (proceed !== 'Continue') {
                return;
            }

            // Step 1: API URL
            const apiUrl = await vscode.window.showInputBox({
                prompt: 'Enter your Project Master API URL',
                placeHolder: 'http://localhost:8080',
                value: this.configService.getApiUrl(),
                validateInput: (value) => {
                    if (!value) {
                        return 'API URL is required';
                    }
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return 'Please enter a valid URL';
                    }
                }
            });

            if (!apiUrl) {
                vscode.window.showWarningMessage('Setup cancelled: API URL is required');
                return;
            }

            // Step 2: API Key (optional)
            const needsApiKey = await vscode.window.showQuickPick(
                ['Yes', 'No'],
                {
                    placeHolder: 'Does your API require authentication?'
                }
            );

            let apiKey = '';
            if (needsApiKey === 'Yes') {
                const inputApiKey = await vscode.window.showInputBox({
                    prompt: 'Enter your API key',
                    placeHolder: 'your-api-key-here',
                    password: true,
                    value: this.configService.getApiKey()
                });

                if (inputApiKey) {
                    apiKey = inputApiKey;
                }
            }

            // Step 3: Web UI URL
            const webUrl = await vscode.window.showInputBox({
                prompt: 'Enter your Project Master Web UI URL',
                placeHolder: 'http://localhost:3000',
                value: this.configService.getWebUrl(),
                validateInput: (value) => {
                    if (!value) {
                        return 'Web UI URL is required';
                    }
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return 'Please enter a valid URL';
                    }
                }
            });

            if (!webUrl) {
                vscode.window.showWarningMessage('Setup cancelled: Web UI URL is required');
                return;
            }

            // Save configuration
            await this.configService.setApiUrl(apiUrl);
            await this.configService.setApiKey(apiKey);
            await this.configService.setWebUrl(webUrl);

            this.logger.info('Configuration saved', {
                apiUrl,
                webUrl
            });

            // Test connection
            const testNow = await vscode.window.showInformationMessage(
                'Configuration saved! Would you like to test the connection now?',
                'Test Connection',
                'Skip'
            );

            if (testNow === 'Test Connection') {
                await this.testConnection();
            } else {
                vscode.window.showInformationMessage('Setup completed successfully!');
            }

        } catch (error) {
            this.logger.error('Setup wizard failed', error);
            vscode.window.showErrorMessage('Setup wizard failed. Please check the logs.');
        }
    }

    private async testConnection(): Promise<void> {
        this.logger.info('Testing API connection...');

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Testing connection to Project Master API...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Update API service configuration
                this.apiService.updateConfiguration();

                progress.report({ increment: 50, message: 'Checking API health...' });

                // Test connection
                const isHealthy = await this.apiService.healthCheck();

                progress.report({ increment: 100 });

                if (isHealthy) {
                    vscode.window.showInformationMessage('✅ Connection successful! Project Master API is reachable.');
                    this.logger.info('API connection test successful');
                } else {
                    vscode.window.showErrorMessage('❌ Connection failed! Please check your API URL and network connection.');
                    this.logger.error('API connection test failed');
                }
            });

        } catch (error) {
            this.logger.error('Connection test failed', error);
            vscode.window.showErrorMessage('Connection test failed. Please check your configuration and try again.');
        }
    }

    private async quickSetup(): Promise<void> {
        this.logger.info('Starting quick setup...');

        try {
            const setupType = await vscode.window.showQuickPick([
                {
                    label: 'Local Development',
                    description: 'API: localhost:8080, Web: localhost:3000',
                    detail: 'Standard local development setup'
                },
                {
                    label: 'Production Server',
                    description: 'Custom URLs for production environment',
                    detail: 'Enter your production server URLs'
                },
                {
                    label: 'Custom Setup',
                    description: 'Manual configuration',
                    detail: 'Configure all settings manually'
                }
            ], {
                placeHolder: 'Choose your setup type'
            });

            if (!setupType) {
                return;
            }

            switch (setupType.label) {
                case 'Local Development':
                    await this.configService.setApiUrl('http://localhost:8080');
                    await this.configService.setWebUrl('http://localhost:3000');
                    await this.configService.setApiKey('');
                    await this.configService.setAutoRefresh(true);
                    await this.configService.setRefreshInterval(30000);

                    vscode.window.showInformationMessage('Local development setup completed!');
                    break;

                case 'Production Server':
                    await this.runSetupWizard();
                    break;

                case 'Custom Setup':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                    break;
            }

        } catch (error) {
            this.logger.error('Quick setup failed', error);
            vscode.window.showErrorMessage('Quick setup failed. Please try again.');
        }
    }
}
