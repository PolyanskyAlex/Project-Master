import * as vscode from 'vscode';
import { ApiService } from './services/ApiService';
import { CachedApiService } from './services/CachedApiService';
import { CacheService } from './services/CacheService';
import { ConfigurationService } from './services/ConfigurationService';
import { Logger } from './utils/Logger';
import { ProjectsProvider } from './providers/ProjectsProvider';
import { TasksProvider } from './providers/TasksProvider';
import { PlanProvider } from './providers/PlanProvider';
import { StatusBarProvider } from './providers/StatusBarProvider';
import { registerCommands } from './commands';
import { SetupCommands } from './commands/setup';

export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger();
    logger.info('Project Master extension is being activated...');
    console.log('=== Project Master: activate() called ===');

    try {
        // Initialize services
        const configService = new ConfigurationService(logger);
        const apiService = new ApiService(configService, logger);
        
        // Initialize caching if enabled
        let cachedApiService: CachedApiService | undefined;
        let cacheService: CacheService | undefined;
        
        const cacheEnabled = vscode.workspace.getConfiguration('projectMaster.cache').get<boolean>('enabled', true);
        if (cacheEnabled) {
            const maxSize = vscode.workspace.getConfiguration('projectMaster.cache').get<number>('maxSize', 1000);
            const defaultTtl = vscode.workspace.getConfiguration('projectMaster.cache').get<number>('defaultTtl', 300000);
            
            cacheService = new CacheService(maxSize, defaultTtl);
            cachedApiService = new CachedApiService(configService, logger, cacheService);
            
            logger.info('Cache service initialized', { maxSize, defaultTtl });
        }

        // Use cached API service if available, otherwise use regular API service
        const effectiveApiService = cachedApiService || apiService;

        // Initialize providers
        const projectsProvider = new ProjectsProvider(effectiveApiService as any, logger);
        const tasksProvider = new TasksProvider(effectiveApiService as any, logger);
        const planProvider = new PlanProvider(effectiveApiService as any, logger);
        const statusBarProvider = new StatusBarProvider(configService, effectiveApiService as any, logger);

        // Register Tree Data Providers
        const projectsTreeView = vscode.window.createTreeView('projectMaster.projects', {
            treeDataProvider: projectsProvider,
            showCollapseAll: true,
            canSelectMany: false
        });

        const tasksTreeView = vscode.window.createTreeView('projectMaster.tasks', {
            treeDataProvider: tasksProvider,
            showCollapseAll: true,
            canSelectMany: false
        });

        const planTreeView = vscode.window.createTreeView('projectMaster.plan', {
            treeDataProvider: planProvider,
            showCollapseAll: true,
            canSelectMany: false
        });

        // Set tree view titles based on selected project
        const updateTreeViewTitles = () => {
            const selectedProject = projectsProvider.getSelectedProject();
            if (selectedProject) {
                tasksTreeView.title = `Tasks - ${selectedProject.name}`;
                planTreeView.title = `Plan - ${selectedProject.name}`;
            } else {
                tasksTreeView.title = 'Tasks';
                planTreeView.title = 'Development Plan';
            }
        };

        // Listen for project selection changes
        vscode.commands.registerCommand('projectMaster.projectSelected', (project) => {
            updateTreeViewTitles();
        });

        // Register commands
        registerCommands(context, {
            apiService,
            cachedApiService,
            configService,
            logger,
            projectsProvider,
            tasksProvider,
            planProvider
        });
        console.log('=== Project Master: registerCommands() called ===');

        // Register setup commands
        const setupCommands = new SetupCommands(configService, effectiveApiService as any, logger);
        setupCommands.registerCommands(context);

        // Initialize status bar
        // statusBarProvider.initialize();

        // Add to subscriptions
        context.subscriptions.push(
            projectsTreeView,
            tasksTreeView,
            planTreeView,
            statusBarProvider
        );

        // Dispose cache service on deactivation
        if (cacheService) {
            context.subscriptions.push({
                dispose: () => cacheService!.dispose()
            });
        }

        // Initial data load
        const loadInitialData = async () => {
            try {
                logger.info('Loading initial data...');
                
                // Update API configuration with server discovery
                await apiService.updateConfigurationWithDiscovery();
                if (cachedApiService) {
                    await cachedApiService.updateConfiguration();
                }
                
                // Preload cache if enabled and configured
                if (cachedApiService) {
                    const preloadOnStartup = vscode.workspace.getConfiguration('projectMaster.cache').get<boolean>('preloadOnStartup', true);
                    if (preloadOnStartup) {
                        logger.info('Preloading cache...');
                        try {
                            await cachedApiService.preloadCache();
                            logger.info('Cache preloaded successfully');
                        } catch (error) {
                            logger.warn('Cache preload failed, continuing without cache', error);
                        }
                    }
                }
                
                // Load projects first
                projectsProvider.refresh();
                
                // Small delay to allow projects to load
                setTimeout(() => {
                    tasksProvider.refresh();
                    planProvider.refresh();
                    updateTreeViewTitles();
                }, 1000);
                
                logger.info('Initial data loading completed');
            } catch (error) {
                logger.error('Failed to load initial data', error);
            }
        };

        // Load data after activation
        loadInitialData();

        // Set up auto-refresh if enabled
        const autoRefresh = configService.getAutoRefresh();
        if (autoRefresh) {
            const refreshInterval = configService.getRefreshInterval();
            const intervalId = setInterval(() => {
                logger.debug('Auto-refreshing data...');
                
                // Clear relevant cache entries before refresh if using cached API
                if (cachedApiService) {
                    cachedApiService.invalidatePattern('projects:.*');
                    cachedApiService.invalidatePattern('tasks:.*');
                    cachedApiService.invalidatePattern('plan:.*');
                }
                
                projectsProvider.refresh();
                tasksProvider.refresh();
                planProvider.refresh();
            }, refreshInterval);

            // Clear interval on deactivation
            context.subscriptions.push({
                dispose: () => clearInterval(intervalId)
            });
        }

        // Listen for configuration changes to update cache settings
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('projectMaster.cache')) {
                logger.info('Cache configuration changed, clearing cache');
                if (cachedApiService) {
                    cachedApiService.clearCache();
                }
            }
            
            if (event.affectsConfiguration('projectMaster.apiUrl') || 
                event.affectsConfiguration('projectMaster.apiKey')) {
                logger.info('API configuration changed, updating services with discovery');
                apiService.updateConfigurationWithDiscovery().then(() => {
                    if (cachedApiService) {
                        cachedApiService.updateConfiguration();
                    }
                }).catch(error => {
                    logger.error('Failed to update configuration with discovery', error);
                });
            }
        });

        context.subscriptions.push(configChangeListener);

        logger.info('Project Master extension activated successfully', {
            cacheEnabled,
            apiService: cachedApiService ? 'CachedApiService' : 'ApiService'
        });
        console.log('=== Project Master: activate() finished ===');

    } catch (error) {
        logger.error('Failed to activate Project Master extension', error);
        vscode.window.showErrorMessage(
            'Failed to activate Project Master extension. Please check the logs and configuration.'
        );
    }
}

export function deactivate() {
    const logger = new Logger();
    logger.info('Project Master extension is being deactivated...');
} 