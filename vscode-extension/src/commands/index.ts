import * as vscode from 'vscode';
import { ApiService } from '../services/ApiService';
import { CachedApiService } from '../services/CachedApiService';
import { IApiService } from '../interfaces/IApiService';
import { ConfigurationService } from '../services/ConfigurationService';
import { Logger } from '../utils/Logger';
import { ProjectsProvider } from '../providers/ProjectsProvider';
import { TasksProvider } from '../providers/TasksProvider';
import { PlanProvider } from '../providers/PlanProvider';
import { ProjectCommands } from './projectCommands';
import { TaskCommands } from './taskCommands';
import { CommentCommands } from './commentCommands';
import { McpCommands } from './mcpCommands';
import { PlanPushCommands } from './planPushCommands';
import { CacheCommands } from './cacheCommands';
import { Project, Task } from '../types';

interface CommandDependencies {
    apiService: ApiService;
    cachedApiService?: CachedApiService;
    configService: ConfigurationService;
    logger: Logger;
    projectsProvider: ProjectsProvider;
    tasksProvider: TasksProvider;
    planProvider: PlanProvider;
}

export function registerCommands(context: vscode.ExtensionContext, deps: CommandDependencies): void {
    console.log('=== PROJECT MASTER: REGISTER COMMANDS START ===');
    console.log('Commands registration context:', {
        subscriptions: context.subscriptions.length,
        deps: Object.keys(deps)
    });
    
    const { apiService, cachedApiService, configService, logger, projectsProvider, tasksProvider, planProvider } = deps;

    // Use cached API service if available
    const effectiveApiService: IApiService = cachedApiService || apiService;

    // Initialize specialized command classes
    const projectCommands = new ProjectCommands(effectiveApiService, logger, projectsProvider);
    const taskCommands = new TaskCommands(effectiveApiService, logger, tasksProvider, projectsProvider);
    const commentCommands = new CommentCommands(effectiveApiService, logger, tasksProvider);
    const mcpCommands = new McpCommands(effectiveApiService);
    const planPushCommands = new PlanPushCommands(context, configService);
    
    // Initialize cache commands if cached API service is available
    let cacheCommands: CacheCommands | undefined;
    if (cachedApiService) {
        cacheCommands = new CacheCommands(cachedApiService);
        cacheCommands.registerCommands(context);
    }

    // Register specialized CRUD commands
    projectCommands.registerCommands(context);
    taskCommands.registerCommands(context);
    commentCommands.registerCommands(context);
    planPushCommands.registerCommands();

    // Core navigation and selection commands
    const selectProjectCommand = vscode.commands.registerCommand('projectMaster.selectProject', async (projectOrId: Project | string) => {
        console.log('=== Project Master: selectProjectCommand registered ===');
        try {
            // Fix: Handle both project object and project ID to prevent circular reference issues
            const project = typeof projectOrId === 'string' 
                ? projectsProvider.getProjectById(projectOrId)
                : projectOrId;
                
            if (!project || !project.id) {
                vscode.window.showWarningMessage('Invalid project selected');
                return;
            }
            
            logger.info(`Selecting project: ${project.name}`);
            
            // Update all providers with selected project
            projectsProvider.selectProject(project);
            tasksProvider.setSelectedProject(project);
            planProvider.setSelectedProject(project);
            
            // Show success message with quick actions
            vscode.window.showInformationMessage(
                `Selected project: ${project.name}`,
                'View Tasks',
                'Create Task',
                'Open Web UI'
            ).then(selection => {
                switch (selection) {
                    case 'View Tasks':
                        vscode.commands.executeCommand('workbench.view.extension.projectMaster');
                        break;
                    case 'Create Task':
                        vscode.commands.executeCommand('projectMaster.tasks.create', project);
                        break;
                    case 'Open Web UI':
                        vscode.commands.executeCommand('projectMaster.openWebUI');
                        break;
                }
            });
            
        } catch (error) {
            logger.error('Failed to select project', error);
            vscode.window.showErrorMessage('Failed to select project. Please try again.');
        }
    });

    // Refresh commands with enhanced feedback
    const refreshProjectsCommand = vscode.commands.registerCommand('projectMaster.refreshProjects', async () => {
        console.log('=== PROJECT MASTER: REFRESH PROJECTS COMMAND EXECUTED ===');
        logger.info('Refresh projects command called');
        
        // Verify command registration
        console.log('Command refreshProjects is executing. Registration successful.');
        
        try {
            console.log('Starting projects refresh...');
            logger.info('Refreshing projects...');
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refreshing projects...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Loading projects...' });
                
                // Clear cache if using cached API service
                if (cachedApiService) {
                    console.log('Clearing cached projects data...');
                    cachedApiService.invalidatePattern('projects:.*');
                }
                
                console.log('Calling projectsProvider.refresh()...');
                await projectsProvider.refresh();
                console.log('projectsProvider.refresh() completed');
                
                progress.report({ increment: 100, message: 'Projects refreshed!' });
            });
            
            const projectCount = projectsProvider.getProjects().length;
            const message = `${projectCount} projects loaded successfully.`;
            console.log('Refresh result:', message);
            logger.info(message);
            vscode.window.showInformationMessage(message);
            
        } catch (error) {
            console.error('Refresh projects command failed:', error);
            logger.error('Failed to refresh projects', error);
            vscode.window.showErrorMessage(`Failed to refresh projects: ${error}`);
        }
    });

    const refreshTasksCommand = vscode.commands.registerCommand('projectMaster.refreshTasks', async () => {
        try {
            logger.info('Refreshing tasks...');
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refreshing tasks...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Loading tasks...' });
                
                // Clear cache if using cached API service
                if (cachedApiService) {
                    cachedApiService.invalidatePattern('tasks:.*');
                }
                
                await tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Tasks refreshed!' });
            });
            
            const taskCount = tasksProvider.getAllTasks().length;
            vscode.window.showInformationMessage(`${taskCount} tasks loaded successfully.`);
            
        } catch (error) {
            logger.error('Failed to refresh tasks', error);
            vscode.window.showErrorMessage('Failed to refresh tasks. Please try again.');
        }
    });

    // Enhanced sync plan command
    const syncPlanCommand = vscode.commands.registerCommand('projectMaster.syncPlan', async () => {
        console.log('=== PROJECT MASTER: SYNC PLAN COMMAND EXECUTED ===');
        logger.info('Sync plan command called');
        
        try {
            const selectedProject = projectsProvider.getSelectedProject();
            console.log('Selected project for sync:', selectedProject?.name || 'None');
            
            if (!selectedProject) {
                const message = 'No project selected. Please select a project first.';
                logger.warn(message);
                console.log('Warning:', message);
                
                vscode.window.showWarningMessage(
                    message,
                    'Select Project'
                ).then(selection => {
                    if (selection === 'Select Project') {
                        vscode.commands.executeCommand('workbench.view.extension.projectMaster');
                    }
                });
                return;
            }
            
            console.log('Calling planProvider.syncPlan()...');
            await planProvider.syncPlan();
            console.log('planProvider.syncPlan() completed successfully');
            logger.info('Development plan synced successfully');
            
        } catch (error) {
            console.error('Sync plan command failed:', error);
            logger.error('Failed to sync development plan', error);
            vscode.window.showErrorMessage(`Failed to sync development plan: ${error}`);
        }
    });

    // Legacy create commands (redirected to new CRUD commands)
    const createProjectCommand = vscode.commands.registerCommand('projectMaster.createProject', async () => {
        vscode.commands.executeCommand('projectMaster.projects.create');
    });

    const createTaskCommand = vscode.commands.registerCommand('projectMaster.createTask', async () => {
        vscode.commands.executeCommand('projectMaster.tasks.create');
    });

    // Enhanced open task command
    const openTaskCommand = vscode.commands.registerCommand('projectMaster.openTask', async (task: Task) => {
        vscode.commands.executeCommand('projectMaster.tasks.viewDetails', task);
    });

    // Enhanced web UI command
    const openWebUICommand = vscode.commands.registerCommand('projectMaster.openWebUI', async () => {
        try {
            const webUrl = configService.getWebUrl();
            
            if (!webUrl) {
                vscode.window.showWarningMessage(
                    'Web UI URL not configured. Please configure the extension first.',
                    'Open Settings',
                    'Setup Wizard'
                ).then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                    } else if (selection === 'Setup Wizard') {
                        vscode.commands.executeCommand('projectMaster.setupWizard');
                    }
                });
                return;
            }
            
            logger.info(`Opening web UI: ${webUrl}`);
            
            await vscode.env.openExternal(vscode.Uri.parse(webUrl));
            
            // Optional: Show success message
            vscode.window.showInformationMessage('Web UI opened in your default browser.');
            
        } catch (error) {
            logger.error('Failed to open web UI', error);
            vscode.window.showErrorMessage(
                'Failed to open web UI. Please check your configuration.',
                'Check Settings',
                'Test Connection'
            ).then(selection => {
                if (selection === 'Check Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                } else if (selection === 'Test Connection') {
                    vscode.commands.executeCommand('projectMaster.testConnection');
                }
            });
        }
    });

    // Bulk operations commands
    const refreshAllCommand = vscode.commands.registerCommand('projectMaster.refreshAll', async () => {
        try {
            logger.info('Refreshing all data...');
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refreshing all data...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Refreshing projects...' });
                await projectsProvider.refresh();
                
                progress.report({ increment: 33, message: 'Refreshing tasks...' });
                await tasksProvider.refresh();
                
                progress.report({ increment: 66, message: 'Refreshing development plan...' });
                await planProvider.refresh();
                
                progress.report({ increment: 100, message: 'All data refreshed!' });
            });
            
            vscode.window.showInformationMessage('All data refreshed successfully.');
            
        } catch (error) {
            logger.error('Failed to refresh all data', error);
            vscode.window.showErrorMessage('Failed to refresh all data. Please try again.');
        }
    });

    // Search and filter commands
    const searchTasksCommand = vscode.commands.registerCommand('projectMaster.searchTasks', async () => {
        try {
            const searchQuery = await vscode.window.showInputBox({
                prompt: 'Search tasks by title or description',
                placeHolder: 'Enter search terms...',
                validateInput: (value) => {
                    if (value && value.length < 2) {
                        return 'Search query must be at least 2 characters';
                    }
                    return null;
                }
            });

            if (!searchQuery) return;

            // This would filter tasks in the provider
            // For now, we'll show a message
            vscode.window.showInformationMessage(
                `Searching for tasks containing: "${searchQuery}"`,
                'Open Web UI'
            ).then(selection => {
                if (selection === 'Open Web UI') {
                    vscode.commands.executeCommand('projectMaster.openWebUI');
                }
            });

        } catch (error) {
            logger.error('Failed to search tasks', error);
            vscode.window.showErrorMessage('Failed to search tasks. Please try again.');
        }
    });

    // Filter by status command
    const filterByStatusCommand = vscode.commands.registerCommand('projectMaster.filterByStatus', async () => {
        try {
            const statusOptions = [
                { label: '$(circle-outline) To Do', value: 'todo' },
                { label: '$(sync) In Progress', value: 'in_progress' },
                { label: '$(eye) Review', value: 'review' },
                { label: '$(check) Done', value: 'done' },
                { label: '$(x) Cancelled', value: 'cancelled' },
                { label: '$(list-unordered) Show All', value: 'all' }
            ];

            const selectedStatus = await vscode.window.showQuickPick(statusOptions, {
                placeHolder: 'Filter tasks by status'
            });

            if (!selectedStatus) return;

            // This would apply filter in the provider
            vscode.window.showInformationMessage(
                `Filtering tasks by status: ${selectedStatus.label.replace(/\$\([^)]+\)\s*/, '')}`,
                'Clear Filter',
                'Open Web UI'
            ).then(selection => {
                if (selection === 'Clear Filter') {
                    vscode.commands.executeCommand('projectMaster.clearFilters');
                } else if (selection === 'Open Web UI') {
                    vscode.commands.executeCommand('projectMaster.openWebUI');
                }
            });

        } catch (error) {
            logger.error('Failed to filter tasks', error);
            vscode.window.showErrorMessage('Failed to filter tasks. Please try again.');
        }
    });

    // Clear filters command
    const clearFiltersCommand = vscode.commands.registerCommand('projectMaster.clearFilters', async () => {
        try {
            // This would clear all filters in providers
            tasksProvider.refresh();
            vscode.window.showInformationMessage('All filters cleared.');
        } catch (error) {
            logger.error('Failed to clear filters', error);
            vscode.window.showErrorMessage('Failed to clear filters. Please try again.');
        }
    });

    // Test command for debugging
    const testCommand = vscode.commands.registerCommand('projectMaster.test', async () => {
        console.log('=== PROJECT MASTER: TEST COMMAND EXECUTED ===');
        try {
            const message = `Extension is working! API Service: ${deps.cachedApiService ? 'Cached' : 'Regular'}`;
            console.log('Test command result:', message);
            vscode.window.showInformationMessage(message);
            logger.info('Test command executed successfully');
        } catch (error) {
            console.error('Test command failed:', error);
            vscode.window.showErrorMessage(`Test command failed: ${error}`);
        }
    });

    // Show statistics command
    const showStatsCommand = vscode.commands.registerCommand('projectMaster.showStats', async () => {
        try {
            const projects = projectsProvider.getProjects();
            const tasks = tasksProvider.getAllTasks();
            const selectedProject = projectsProvider.getSelectedProject();

            const projectStats = projects.reduce((acc, project) => {
                acc[project.status] = (acc[project.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const taskStats = tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const statsContent = `# Project Master Statistics

## Overview
- **Total Projects:** ${projects.length}
- **Total Tasks:** ${tasks.length}
- **Selected Project:** ${selectedProject?.name || 'None'}

## Project Status Distribution
${Object.entries(projectStats).map(([status, count]) => `- **${status}:** ${count}`).join('\n')}

## Task Status Distribution
${Object.entries(taskStats).map(([status, count]) => `- **${status}:** ${count}`).join('\n')}

${selectedProject ? `
## Selected Project Tasks
- **Project:** ${selectedProject.name}
- **Tasks in Project:** ${tasks.filter(t => t.project_id === selectedProject.id).length}
- **Completed Tasks:** ${tasks.filter(t => t.project_id === selectedProject.id && t.status === 'done').length}
` : ''}

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

        } catch (error) {
            logger.error('Failed to show statistics', error);
            vscode.window.showErrorMessage('Failed to show statistics. Please try again.');
        }
    });

    // MCP Commands
    const executeMcpCommand = vscode.commands.registerCommand('projectMaster.mcp.execute', async (uri?: vscode.Uri) => {
        await mcpCommands.executeMcpFile(uri);
    });

    const validateMcpCommand = vscode.commands.registerCommand('projectMaster.mcp.validate', async (uri?: vscode.Uri) => {
        await mcpCommands.validateMcpFile(uri);
    });

    const createMcpCommand = vscode.commands.registerCommand('projectMaster.mcp.create', async () => {
        await mcpCommands.createMcpFile();
    });

    const findMcpFilesCommand = vscode.commands.registerCommand('projectMaster.mcp.findFiles', async () => {
        await mcpCommands.findMcpFiles();
    });

    // Register all commands
    context.subscriptions.push(
        selectProjectCommand,
        refreshProjectsCommand,
        refreshTasksCommand,
        syncPlanCommand,
        createProjectCommand,
        createTaskCommand,
        openTaskCommand,
        openWebUICommand,
        refreshAllCommand,
        searchTasksCommand,
        filterByStatusCommand,
        clearFiltersCommand,
        testCommand,
        showStatsCommand,
        executeMcpCommand,
        validateMcpCommand,
        createMcpCommand,
        findMcpFilesCommand
    );

    // Verify commands were registered successfully
    const totalCommands = context.subscriptions.length;
    
    console.log('=== PROJECT MASTER: COMMAND REGISTRATION VERIFICATION ===');
    console.log('Total subscriptions added to context:', totalCommands);
    console.log('Critical commands registered:', {
        syncPlan: 'projectMaster.syncPlan',
        refreshProjects: 'projectMaster.refreshProjects'
    });
    
    logger.info(`All commands registered successfully. Total subscriptions: ${totalCommands}`);
    console.log('=== PROJECT MASTER: REGISTER COMMANDS END ===');
    console.log('Final registration summary:', {
        totalSubscriptions: totalCommands,
        commandsInDeps: Object.keys(deps),
        registrationComplete: true
    });
    
    // Verify commands are actually available
    setTimeout(async () => {
        try {
            const allCommands = await vscode.commands.getCommands(true);
            const projectMasterCommands = allCommands.filter(cmd => cmd.startsWith('projectMaster.'));
            console.log('=== PROJECT MASTER: COMMAND VERIFICATION ===');
            console.log('Total commands in VS Code:', allCommands.length);
            console.log('Project Master commands found:', projectMasterCommands.length);
            console.log('Project Master commands list:', projectMasterCommands);
            
            if (projectMasterCommands.includes('projectMaster.refreshProjects')) {
                console.log('✅ refreshProjects command is available');
            } else {
                console.error('❌ refreshProjects command NOT FOUND');
            }
            
        } catch (error) {
            console.error('Failed to verify commands:', error);
        }
    }, 1000);
} 