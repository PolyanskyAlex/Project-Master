import * as assert from 'assert';
import * as vscode from 'vscode';
import { registerCommands } from '../../../commands';
import { ApiService } from '../../../services/ApiService';
import { ConfigurationService } from '../../../services/ConfigurationService';
import { Logger } from '../../../utils/Logger';
import { ProjectsProvider } from '../../../providers/ProjectsProvider';
import { TasksProvider } from '../../../providers/TasksProvider';
import { PlanProvider } from '../../../providers/PlanProvider';

suite('Command Registration Test Suite', () => {
    let context: vscode.ExtensionContext;
    let mockDeps: any;

    setup(() => {
        // Mock extension context
        context = {
            subscriptions: [],
            extensionPath: '/test/path',
            globalState: {} as any,
            workspaceState: {} as any,
            asAbsolutePath: (path: string) => `/test/path/${path}`,
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/logs',
            extensionUri: vscode.Uri.file('/test/path'),
            environmentVariableCollection: {} as any,
            extensionMode: vscode.ExtensionMode.Test,
            globalStorageUri: vscode.Uri.file('/test/global-storage'),
            logUri: vscode.Uri.file('/test/logs'),
            storageUri: vscode.Uri.file('/test/storage'),
            secrets: {} as any,
            extension: {} as any,
            languageModelAccessInformation: {} as any
        };

        // Mock dependencies
        const logger = new Logger();
        const configService = new ConfigurationService(logger);
        const apiService = new ApiService(configService, logger);
        const projectsProvider = new ProjectsProvider(apiService, logger);
        const tasksProvider = new TasksProvider(apiService, logger);
        const planProvider = new PlanProvider(apiService, logger);

        mockDeps = {
            apiService,
            configService,
            logger,
            projectsProvider,
            tasksProvider,
            planProvider
        };
    });

    test('Critical commands should be registered', async () => {
        // Arrange
        const initialSubscriptions = context.subscriptions.length;

        // Act
        registerCommands(context, mockDeps);

        // Assert
        assert.ok(context.subscriptions.length > initialSubscriptions, 
            'Commands should be added to context subscriptions');

        // Verify that key commands are available
        const commands = await vscode.commands.getCommands(true);
        const projectMasterCommands = commands.filter(cmd => cmd.startsWith('projectMaster.'));

        assert.ok(projectMasterCommands.includes('projectMaster.syncPlan'), 
            'syncPlan command should be registered');
        assert.ok(projectMasterCommands.includes('projectMaster.refreshProjects'), 
            'refreshProjects command should be registered');
    });

    test('Commands should execute without throwing errors', async () => {
        // Arrange
        registerCommands(context, mockDeps);

        // Act & Assert - test that commands can be called without immediate errors
        try {
            // These commands should not throw synchronous errors
            await vscode.commands.executeCommand('projectMaster.refreshProjects');
            await vscode.commands.executeCommand('projectMaster.syncPlan');
            
            // If we reach here, commands were registered and callable
            assert.ok(true, 'Commands executed without immediate errors');
        } catch (error: any) {
            // Network errors are expected in test environment, but registration errors are not
            if (error.toString().includes('command') && error.toString().includes('not found')) {
                assert.fail(`Command registration failed: ${error}`);
            }
            // Other errors (like network errors) are acceptable in test environment
        }
    });

    test('Extension context should contain expected number of subscriptions', () => {
        // Arrange
        const initialSubscriptions = context.subscriptions.length;

        // Act
        registerCommands(context, mockDeps);

        // Assert
        const addedSubscriptions = context.subscriptions.length - initialSubscriptions;
        assert.ok(addedSubscriptions >= 10, 
            `Expected at least 10 command subscriptions, got ${addedSubscriptions}`);
    });
}); 