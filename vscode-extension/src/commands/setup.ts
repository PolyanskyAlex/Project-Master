import * as vscode from "vscode";
import { ConfigurationService } from '../services/ConfigurationService';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { ServerDiscoveryService } from '../services/ServerDiscoveryService';

export class SetupCommands {
    private configService: ConfigurationService;
    private apiService: IApiService;
    private logger: Logger;
    private serverDiscovery: ServerDiscoveryService;

    constructor(configService: ConfigurationService, apiService: IApiService, logger: Logger) {
        this.configService = configService;
        this.apiService = apiService;
        this.logger = logger;
        this.serverDiscovery = new ServerDiscoveryService(logger);
    }

    registerCommands(context: vscode.ExtensionContext): void {
        // Discover server command
        const discoverServerCommand = vscode.commands.registerCommand(
            'projectMaster.discoverServer',
            this.discoverServer.bind(this)
        );

        // Setup API configuration command
        const setupApiCommand = vscode.commands.registerCommand(
            'projectMaster.setupApi',
            this.setupApiConfiguration.bind(this)
        );

        // Test API connection command
        const testConnectionCommand = vscode.commands.registerCommand(
            'projectMaster.testConnection',
            this.testConnection.bind(this)
        );

        context.subscriptions.push(
            discoverServerCommand,
            setupApiCommand,
            testConnectionCommand
        );

        this.logger.info('Setup commands registered successfully');
    }

    private async discoverServer(): Promise<void> {
        try {
            this.logger.info('Manual server discovery initiated');
            
            const result = await this.serverDiscovery.discoverBackendServer();
            
            if (result.discovered) {
                const message = `Server discovered at ${result.baseURL} (method: ${result.method})`;
                this.logger.info(message);
                
                const action = await vscode.window.showInformationMessage(
                    message,
                    'Update Configuration',
                    'Test Connection',
                    'OK'
                );

                if (action === 'Update Configuration') {
                    await this.configService.setApiUrl(result.baseURL);
                    vscode.window.showInformationMessage('Configuration updated successfully!');
                } else if (action === 'Test Connection') {
                    await this.testConnection();
                }
            } else {
                const message = 'No active server found. Please ensure the backend is running.';
                this.logger.warn(message);
                
                const action = await vscode.window.showWarningMessage(
                    message,
                    'Setup Manually',
                    'OK'
                );

                if (action === 'Setup Manually') {
                    await this.setupApiConfiguration();
                }
            }
        } catch (error) {
            this.logger.error('Server discovery failed', error);
            vscode.window.showErrorMessage(`Server discovery failed: ${error}`);
        }
    }

    private async setupApiConfiguration(): Promise<void> {
        try {
            // Get API URL
            const apiUrl = await vscode.window.showInputBox({
                prompt: 'Enter the API URL',
                value: this.configService.getApiUrl(),
                placeHolder: 'http://localhost:8080'
            });

            if (!apiUrl) {
                return;
            }

            // Get API Key
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter the API Key (optional)',
                value: this.configService.getApiKey(),
                password: true,
                placeHolder: 'your-api-key'
            });

            // Update configuration
            await this.configService.setApiUrl(apiUrl);
            if (apiKey) {
                await this.configService.setApiKey(apiKey);
            }

            this.logger.info('API configuration updated manually', { apiUrl: apiUrl });
            
            const testConnection = await vscode.window.showInformationMessage(
                'Configuration saved successfully!',
                'Test Connection',
                'OK'
            );

            if (testConnection === 'Test Connection') {
                await this.testConnection();
            }
        } catch (error) {
            this.logger.error('Failed to setup API configuration', error);
            vscode.window.showErrorMessage(`Configuration setup failed: ${error}`);
        }
    }

    private async testConnection(): Promise<void> {
        try {
            this.logger.info('Testing API connection...');
            
            const isHealthy = await this.apiService.healthCheck();
            
            if (isHealthy) {
                const message = 'Connection successful! API is reachable.';
                this.logger.info(message);
                vscode.window.showInformationMessage(message);
            } else {
                const message = 'Connection failed. Please check your API configuration.';
                this.logger.warn(message);
                
                const action = await vscode.window.showWarningMessage(
                    message,
                    'Discover Server',
                    'Setup Manually',
                    'OK'
                );

                if (action === 'Discover Server') {
                    await this.discoverServer();
                } else if (action === 'Setup Manually') {
                    await this.setupApiConfiguration();
                }
            }
        } catch (error) {
            this.logger.error('Connection test failed', error);
            
            const action = await vscode.window.showErrorMessage(
                `Connection test failed: ${error}`,
                'Discover Server',
                'Setup Manually',
                'OK'
            );

            if (action === 'Discover Server') {
                await this.discoverServer();
            } else if (action === 'Setup Manually') {
                await this.setupApiConfiguration();
            }
        }
    }
}
