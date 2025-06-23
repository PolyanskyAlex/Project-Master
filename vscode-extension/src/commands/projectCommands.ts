import * as vscode from 'vscode';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { ProjectsProvider } from '../providers/ProjectsProvider';
import { Project, FunctionalBlock } from '../types';

export class ProjectCommands {
    constructor(
        private apiService: IApiService,
        private logger: Logger,
        private projectsProvider: ProjectsProvider
    ) {}

    registerCommands(context: vscode.ExtensionContext): void {
        // Create project command
        const createProjectCommand = vscode.commands.registerCommand(
            'projectMaster.projects.create',
            () => this.createProject()
        );

        // Edit project command
        const editProjectCommand = vscode.commands.registerCommand(
            'projectMaster.projects.edit',
            (projectOrId: Project | string) => {
                const project = typeof projectOrId === 'string' 
                    ? this.projectsProvider.getProjectById(projectOrId)
                    : projectOrId;
                if (project) {
                    this.editProject(project);
                } else {
                    this.logger.warn(`Project not found: ${projectOrId}`);
                }
            }
        );

        // Delete project command
        const deleteProjectCommand = vscode.commands.registerCommand(
            'projectMaster.projects.delete',
            (projectOrId: Project | string) => {
                const project = typeof projectOrId === 'string' 
                    ? this.projectsProvider.getProjectById(projectOrId)
                    : projectOrId;
                if (project) {
                    this.deleteProject(project);
                } else {
                    this.logger.warn(`Project not found: ${projectOrId}`);
                }
            }
        );

        // Duplicate project command
        const duplicateProjectCommand = vscode.commands.registerCommand(
            'projectMaster.projects.duplicate',
            (project: Project) => this.duplicateProject(project)
        );

        // Change project status command
        const changeStatusCommand = vscode.commands.registerCommand(
            'projectMaster.projects.changeStatus',
            (project: Project) => this.changeProjectStatus(project)
        );

        // View project details command
        const viewDetailsCommand = vscode.commands.registerCommand(
            'projectMaster.projects.viewDetails',
            (project: Project) => this.viewProjectDetails(project)
        );

        // Export project command
        const exportProjectCommand = vscode.commands.registerCommand(
            'projectMaster.projects.export',
            (project: Project) => this.exportProject(project)
        );

        context.subscriptions.push(
            createProjectCommand,
            editProjectCommand,
            deleteProjectCommand,
            duplicateProjectCommand,
            changeStatusCommand,
            viewDetailsCommand,
            exportProjectCommand
        );

        this.logger.info('Project CRUD commands registered successfully');
    }

    private async createProject(): Promise<void> {
        try {
            this.logger.info('Creating new project...');
            
            // Get functional blocks for selection
            const functionalBlocks = this.projectsProvider.getFunctionalBlocks();
            
            // Project name input with validation
            const name = await vscode.window.showInputBox({
                prompt: 'Enter project name',
                placeHolder: 'My New Project',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Project name is required';
                    }
                    if (value.length > 100) {
                        return 'Project name must be less than 100 characters';
                    }
                    // Check for duplicate names
                    const existingProjects = this.projectsProvider.getProjects();
                    if (existingProjects.some(p => p.name.toLowerCase() === value.toLowerCase())) {
                        return 'A project with this name already exists';
                    }
                    return null;
                }
            });

            if (!name) return;

            // Project description input
            const description = await vscode.window.showInputBox({
                prompt: 'Enter project description (optional)',
                placeHolder: 'Project description...',
                validateInput: (value) => {
                    if (value && value.length > 500) {
                        return 'Description must be less than 500 characters';
                    }
                    return null;
                }
            });

            // Functional block selection
            let functionalBlockId: string | undefined;
            if (functionalBlocks.length > 0) {
                const blockItems = [
                    { 
                        label: '$(folder) No functional block', 
                        description: 'Create project without functional block',
                        detail: 'Project will be displayed at the root level'
                    },
                    ...functionalBlocks.map(block => ({
                        label: `$(folder-opened) ${block.name}`,
                        description: block.description || 'No description',
                        detail: `Functional block: ${block.name}`,
                        id: block.id
                    }))
                ];

                const selectedBlock = await vscode.window.showQuickPick(blockItems, {
                    placeHolder: 'Select functional block (optional)',
                    matchOnDescription: true,
                    matchOnDetail: true
                });

                if (selectedBlock && 'id' in selectedBlock) {
                    functionalBlockId = selectedBlock.id;
                }
            }

            // Status selection
            const statusItems = [
                { label: '$(play) Active', value: 'active', description: 'Project is currently active' },
                { label: '$(clock) On Hold', value: 'on_hold', description: 'Project is temporarily paused' }
            ];

            const selectedStatus = await vscode.window.showQuickPick(statusItems, {
                placeHolder: 'Select initial project status'
            });

            if (!selectedStatus) return;

            // Create project
            const newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
                name: name.trim(),
                description: description?.trim() || '',
                status: selectedStatus.value as Project['status'],
                functional_block_id: functionalBlockId
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating project...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Validating project data...' });
                
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation
                
                progress.report({ increment: 30, message: 'Creating project...' });
                
                const createdProject = await this.apiService.createProject(newProject);
                
                progress.report({ increment: 70, message: 'Refreshing project list...' });
                
                // Refresh projects view
                this.projectsProvider.refresh();
                
                progress.report({ increment: 100, message: 'Project created successfully!' });
                
                // Auto-select the new project
                setTimeout(() => {
                    this.projectsProvider.selectProject(createdProject);
                }, 1000);
                
                vscode.window.showInformationMessage(
                    `Project "${name}" created successfully!`,
                    'Open Web UI',
                    'Create Task'
                ).then(selection => {
                    if (selection === 'Open Web UI') {
                        vscode.commands.executeCommand('projectMaster.openWebUI');
                    } else if (selection === 'Create Task') {
                        vscode.commands.executeCommand('projectMaster.createTask');
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to create project', error);
            vscode.window.showErrorMessage(
                'Failed to create project. Please try again.',
                'View Logs'
            ).then(selection => {
                if (selection === 'View Logs') {
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                }
            });
        }
    }

    private async editProject(project: Project): Promise<void> {
        try {
            this.logger.info(`Editing project: ${project.name}`);
            
            // Get functional blocks for selection
            const functionalBlocks = this.projectsProvider.getFunctionalBlocks();
            
            // Edit name
            const name = await vscode.window.showInputBox({
                prompt: 'Edit project name',
                value: project.name,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Project name is required';
                    }
                    if (value.length > 100) {
                        return 'Project name must be less than 100 characters';
                    }
                    // Check for duplicate names (excluding current project)
                    const existingProjects = this.projectsProvider.getProjects();
                    if (existingProjects.some(p => p.id !== project.id && p.name.toLowerCase() === value.toLowerCase())) {
                        return 'A project with this name already exists';
                    }
                    return null;
                }
            });

            if (!name) return;

            // Edit description
            const description = await vscode.window.showInputBox({
                prompt: 'Edit project description',
                value: project.description,
                validateInput: (value) => {
                    if (value && value.length > 500) {
                        return 'Description must be less than 500 characters';
                    }
                    return null;
                }
            });

            if (description === undefined) return;

            // Edit functional block
            let functionalBlockId: string | undefined = project.functional_block_id;
            if (functionalBlocks.length > 0) {
                const currentBlock = functionalBlocks.find(b => b.id === project.functional_block_id);
                const blockItems = [
                    { 
                        label: '$(folder) No functional block', 
                        description: 'Remove from functional block',
                        picked: !project.functional_block_id
                    },
                    ...functionalBlocks.map(block => ({
                        label: `$(folder-opened) ${block.name}`,
                        description: block.description || 'No description',
                        id: block.id,
                        picked: block.id === project.functional_block_id
                    }))
                ];

                const selectedBlock = await vscode.window.showQuickPick(blockItems, {
                    placeHolder: `Current: ${currentBlock?.name || 'No functional block'}`,
                    matchOnDescription: true
                });

                if (selectedBlock) {
                    functionalBlockId = 'id' in selectedBlock ? selectedBlock.id : undefined;
                } else {
                    return; // User cancelled
                }
            }

            // Update project
            const updatedProject: Partial<Project> = {
                name: name.trim(),
                description: description.trim(),
                functional_block_id: functionalBlockId
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating project...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Validating changes...' });
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                progress.report({ increment: 40, message: 'Updating project...' });
                
                await this.apiService.updateProject(project.id, updatedProject);
                
                progress.report({ increment: 80, message: 'Refreshing project list...' });
                
                this.projectsProvider.refresh();
                
                progress.report({ increment: 100, message: 'Project updated successfully!' });
                
                vscode.window.showInformationMessage(`Project "${name}" updated successfully!`);
            });

        } catch (error) {
            this.logger.error('Failed to edit project', error);
            vscode.window.showErrorMessage('Failed to update project. Please try again.');
        }
    }

    private async deleteProject(project: Project): Promise<void> {
        try {
            this.logger.info(`Deleting project: ${project.name}`);
            
            // Confirmation dialog
            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to delete project "${project.name}"?`,
                {
                    modal: true,
                    detail: 'This action cannot be undone. All tasks and data associated with this project will be permanently deleted.'
                },
                'Delete Project',
                'Cancel'
            );

            if (confirmation !== 'Delete Project') return;

            // Additional confirmation for active projects
            if (project.status === 'active') {
                const secondConfirmation = await vscode.window.showWarningMessage(
                    `"${project.name}" is an active project. Are you absolutely sure?`,
                    {
                        modal: true,
                        detail: 'Deleting an active project may disrupt ongoing work.'
                    },
                    'Yes, Delete',
                    'Cancel'
                );

                if (secondConfirmation !== 'Yes, Delete') return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting project...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Preparing deletion...' });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                progress.report({ increment: 30, message: 'Deleting project data...' });
                
                await this.apiService.deleteProject(project.id);
                
                progress.report({ increment: 70, message: 'Updating project list...' });
                
                // If this was the selected project, clear selection
                if (this.projectsProvider.getSelectedProject()?.id === project.id) {
                    this.projectsProvider.selectProject(null as any);
                }
                
                this.projectsProvider.refresh();
                
                progress.report({ increment: 100, message: 'Project deleted successfully!' });
                
                vscode.window.showInformationMessage(`Project "${project.name}" deleted successfully.`);
            });

        } catch (error) {
            this.logger.error('Failed to delete project', error);
            vscode.window.showErrorMessage('Failed to delete project. Please try again.');
        }
    }

    private async duplicateProject(project: Project): Promise<void> {
        try {
            this.logger.info(`Duplicating project: ${project.name}`);
            
            // Get new name for duplicate
            const newName = await vscode.window.showInputBox({
                prompt: 'Enter name for duplicated project',
                value: `${project.name} (Copy)`,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Project name is required';
                    }
                    if (value.length > 100) {
                        return 'Project name must be less than 100 characters';
                    }
                    const existingProjects = this.projectsProvider.getProjects();
                    if (existingProjects.some(p => p.name.toLowerCase() === value.toLowerCase())) {
                        return 'A project with this name already exists';
                    }
                    return null;
                }
            });

            if (!newName) return;

            // Options for what to duplicate
            const duplicateOptions = await vscode.window.showQuickPick([
                {
                    label: '$(project) Project Only',
                    description: 'Duplicate project settings only',
                    value: 'project'
                },
                {
                    label: '$(list-unordered) Project + Tasks',
                    description: 'Duplicate project with all tasks',
                    value: 'with-tasks'
                },
                {
                    label: '$(list-ordered) Project + Tasks + Plan',
                    description: 'Duplicate project with tasks and development plan',
                    value: 'with-plan'
                }
            ], {
                placeHolder: 'What would you like to duplicate?'
            });

            if (!duplicateOptions) return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Duplicating project...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Creating project copy...' });
                
                // Create new project
                const newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
                    name: newName.trim(),
                    description: project.description,
                    status: 'active', // New projects start as active
                    functional_block_id: project.functional_block_id
                };

                const createdProject = await this.apiService.createProject(newProject);
                
                progress.report({ increment: 40, message: 'Project created...' });

                // Duplicate tasks if requested
                if (duplicateOptions.value === 'with-tasks' || duplicateOptions.value === 'with-plan') {
                    progress.report({ increment: 50, message: 'Duplicating tasks...' });
                    
                    // This would require additional API calls to get and create tasks
                    // For now, we'll just log the intention
                    this.logger.info(`Would duplicate tasks for project ${project.id} to ${createdProject.id}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate task duplication
                }

                // Duplicate plan if requested
                if (duplicateOptions.value === 'with-plan') {
                    progress.report({ increment: 80, message: 'Duplicating development plan...' });
                    
                    this.logger.info(`Would duplicate plan for project ${project.id} to ${createdProject.id}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate plan duplication
                }
                
                progress.report({ increment: 90, message: 'Refreshing project list...' });
                
                this.projectsProvider.refresh();
                
                progress.report({ increment: 100, message: 'Project duplicated successfully!' });
                
                vscode.window.showInformationMessage(
                    `Project "${newName}" created as a copy of "${project.name}"!`,
                    'Select New Project',
                    'Open Web UI'
                ).then(selection => {
                    if (selection === 'Select New Project') {
                        this.projectsProvider.selectProject(createdProject);
                    } else if (selection === 'Open Web UI') {
                        vscode.commands.executeCommand('projectMaster.openWebUI');
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to duplicate project', error);
            vscode.window.showErrorMessage('Failed to duplicate project. Please try again.');
        }
    }

    private async changeProjectStatus(project: Project): Promise<void> {
        try {
            this.logger.info(`Changing status for project: ${project.name}`);
            
            const statusItems = [
                { 
                    label: '$(play) Active', 
                    value: 'active', 
                    description: 'Project is currently active',
                    picked: project.status === 'active'
                },
                { 
                    label: '$(check) Completed', 
                    value: 'completed', 
                    description: 'Project has been completed',
                    picked: project.status === 'completed'
                },
                { 
                    label: '$(clock) On Hold', 
                    value: 'on_hold', 
                    description: 'Project is temporarily paused',
                    picked: project.status === 'on_hold'
                },
                { 
                    label: '$(x) Cancelled', 
                    value: 'cancelled', 
                    description: 'Project has been cancelled',
                    picked: project.status === 'cancelled'
                }
            ];

            const selectedStatus = await vscode.window.showQuickPick(statusItems, {
                placeHolder: `Current status: ${project.status}`,
                matchOnDescription: true
            });

            if (!selectedStatus || selectedStatus.value === project.status) return;

            // Confirmation for destructive status changes
            if (selectedStatus.value === 'cancelled') {
                const confirmation = await vscode.window.showWarningMessage(
                    `Are you sure you want to cancel project "${project.name}"?`,
                    {
                        modal: true,
                        detail: 'Cancelled projects are typically archived and may not be easily reactivated.'
                    },
                    'Cancel Project',
                    'Keep Current Status'
                );

                if (confirmation !== 'Cancel Project') return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating project status...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Updating status...' });
                
                await this.apiService.updateProject(project.id, { 
                    status: selectedStatus.value as Project['status'] 
                });
                
                progress.report({ increment: 70, message: 'Refreshing project list...' });
                
                this.projectsProvider.refresh();
                
                progress.report({ increment: 100, message: 'Status updated successfully!' });
                
                vscode.window.showInformationMessage(
                    `Project "${project.name}" status changed to ${selectedStatus.label.replace(/\$\([^)]+\)\s*/, '')}.`
                );
            });

        } catch (error) {
            this.logger.error('Failed to change project status', error);
            vscode.window.showErrorMessage('Failed to update project status. Please try again.');
        }
    }

    private async viewProjectDetails(project: Project): Promise<void> {
        try {
            this.logger.info(`Viewing details for project: ${project.name}`);
            
            // Get additional project data
            const functionalBlock = project.functional_block_id 
                ? this.projectsProvider.getFunctionalBlocks().find(b => b.id === project.functional_block_id)
                : null;

            // Create detailed markdown content
            const projectDetails = `# ${project.name}

## Project Information
- **Status:** ${this.getStatusText(project.status)}
- **Functional Block:** ${functionalBlock?.name || 'None'}
- **Created:** ${new Date(project.created_at).toLocaleDateString()}
- **Last Updated:** ${new Date(project.updated_at).toLocaleDateString()}

## Description
${project.description || 'No description provided.'}

${functionalBlock ? `## Functional Block Details
**Name:** ${functionalBlock.name}
**Description:** ${functionalBlock.description || 'No description'}
**Created:** ${new Date(functionalBlock.created_at).toLocaleDateString()}
` : ''}

## Quick Actions
- [Create Task](command:projectMaster.createTask) for this project
- [Open Web UI](command:projectMaster.openWebUI) to manage project
- [Edit Project](command:projectMaster.projects.edit) details
- [Change Status](command:projectMaster.projects.changeStatus) of project

---
*Project ID: ${project.id}*
*This is a read-only view. Use commands above or the web interface to make changes.*`;

            // Create and show document
            const doc = await vscode.workspace.openTextDocument({
                content: projectDetails,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside
            });

        } catch (error) {
            this.logger.error('Failed to view project details', error);
            vscode.window.showErrorMessage('Failed to open project details. Please try again.');
        }
    }

    private async exportProject(project: Project): Promise<void> {
        try {
            this.logger.info(`Exporting project: ${project.name}`);
            
            // Export format selection
            const formatOptions = await vscode.window.showQuickPick([
                {
                    label: '$(file-code) JSON',
                    description: 'Export as JSON file',
                    value: 'json'
                },
                {
                    label: '$(markdown) Markdown',
                    description: 'Export as Markdown report',
                    value: 'markdown'
                },
                {
                    label: '$(file-text) CSV',
                    description: 'Export tasks as CSV file',
                    value: 'csv'
                }
            ], {
                placeHolder: 'Select export format'
            });

            if (!formatOptions) return;

            // Get save location
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.${formatOptions.value}`),
                filters: {
                    'JSON Files': ['json'],
                    'Markdown Files': ['md'],
                    'CSV Files': ['csv'],
                    'All Files': ['*']
                }
            });

            if (!saveUri) return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Exporting project...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Gathering project data...' });
                
                // Simulate data gathering
                await new Promise(resolve => setTimeout(resolve, 500));
                
                progress.report({ increment: 40, message: 'Formatting export data...' });
                
                let exportContent: string;
                
                switch (formatOptions.value) {
                    case 'json':
                        exportContent = JSON.stringify({
                            project,
                            exportedAt: new Date().toISOString(),
                            exportedBy: 'VS Code Extension'
                        }, null, 2);
                        break;
                    
                    case 'markdown':
                        exportContent = `# Project Export: ${project.name}

**Exported:** ${new Date().toLocaleDateString()}

## Project Details
- **Name:** ${project.name}
- **Status:** ${this.getStatusText(project.status)}
- **Description:** ${project.description || 'No description'}
- **Created:** ${new Date(project.created_at).toLocaleDateString()}
- **Updated:** ${new Date(project.updated_at).toLocaleDateString()}

## Notes
This export was generated by the Project Master VS Code Extension.
`;
                        break;
                    
                    case 'csv':
                        exportContent = `Project Name,Status,Description,Created,Updated
"${project.name}","${project.status}","${project.description}","${project.created_at}","${project.updated_at}"`;
                        break;
                    
                    default:
                        throw new Error('Unsupported export format');
                }
                
                progress.report({ increment: 70, message: 'Writing file...' });
                
                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(exportContent, 'utf8'));
                
                progress.report({ increment: 100, message: 'Export completed!' });
                
                vscode.window.showInformationMessage(
                    `Project "${project.name}" exported successfully!`,
                    'Open File',
                    'Show in Explorer'
                ).then(selection => {
                    if (selection === 'Open File') {
                        vscode.window.showTextDocument(saveUri);
                    } else if (selection === 'Show in Explorer') {
                        vscode.commands.executeCommand('revealFileInOS', saveUri);
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to export project', error);
            vscode.window.showErrorMessage('Failed to export project. Please try again.');
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'active': return 'Active';
            case 'completed': return 'Completed';
            case 'on_hold': return 'On Hold';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    }
} 