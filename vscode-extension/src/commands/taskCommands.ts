import * as vscode from 'vscode';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { TasksProvider } from '../providers/TasksProvider';
import { ProjectsProvider } from '../providers/ProjectsProvider';
import { Task, Project } from '../types';

export class TaskCommands {
    constructor(
        private apiService: IApiService,
        private logger: Logger,
        private tasksProvider: TasksProvider,
        private projectsProvider: ProjectsProvider
    ) {}

    registerCommands(context: vscode.ExtensionContext): void {
        // Create task command
        const createTaskCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.create',
            (project?: Project) => this.createTask(project)
        );

        // Edit task command
        const editTaskCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.edit',
            (task: Task) => this.editTask(task)
        );

        // Delete task command
        const deleteTaskCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.delete',
            (task: Task) => this.deleteTask(task)
        );

        // Duplicate task command
        const duplicateTaskCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.duplicate',
            (task: Task) => this.duplicateTask(task)
        );

        // Change task status command
        const changeStatusCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.changeStatus',
            (task: Task) => this.changeTaskStatus(task)
        );

        // Change task priority command
        const changePriorityCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.changePriority',
            (task: Task) => this.changeTaskPriority(task)
        );

        // Assign task command
        const assignTaskCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.assign',
            (task: Task) => this.assignTask(task)
        );

        // Set due date command
        const setDueDateCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.setDueDate',
            (task: Task) => this.setTaskDueDate(task)
        );

        // Add time tracking command
        const addTimeCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.addTime',
            (task: Task) => this.addTimeTracking(task)
        );

        // View task details command
        const viewDetailsCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.viewDetails',
            (task: Task) => this.viewTaskDetails(task)
        );

        // Export tasks command
        const exportTasksCommand = vscode.commands.registerCommand(
            'projectMaster.tasks.export',
            () => this.exportTasks()
        );

        context.subscriptions.push(
            createTaskCommand,
            editTaskCommand,
            deleteTaskCommand,
            duplicateTaskCommand,
            changeStatusCommand,
            changePriorityCommand,
            assignTaskCommand,
            setDueDateCommand,
            addTimeCommand,
            viewDetailsCommand,
            exportTasksCommand
        );

        this.logger.info('Task CRUD commands registered successfully');
    }

    private async createTask(preselectedProject?: Project): Promise<void> {
        try {
            this.logger.info('Creating new task...');
            
            // Get projects for selection
            const projects = this.projectsProvider.getProjects();
            
            if (projects.length === 0) {
                vscode.window.showWarningMessage(
                    'No projects available. Please create a project first.',
                    'Create Project'
                ).then(selection => {
                    if (selection === 'Create Project') {
                        vscode.commands.executeCommand('projectMaster.projects.create');
                    }
                });
                return;
            }

            // Project selection
            let selectedProject = preselectedProject || this.projectsProvider.getSelectedProject();
            
            if (!selectedProject) {
                const projectItems = projects.map(project => ({
                    label: `$(project) ${project.name}`,
                    description: this.getStatusText(project.status),
                    detail: project.description || 'No description',
                    project: project
                }));

                const selectedProjectItem = await vscode.window.showQuickPick(projectItems, {
                    placeHolder: 'Select project for the task',
                    matchOnDescription: true,
                    matchOnDetail: true
                });

                if (!selectedProjectItem) return;
                selectedProject = selectedProjectItem.project;
            }

            // Task title input
            const title = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'Task title...',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Task title is required';
                    }
                    if (value.length > 200) {
                        return 'Task title must be less than 200 characters';
                    }
                    return null;
                }
            });

            if (!title) return;

            // Task description input
            const description = await vscode.window.showInputBox({
                prompt: 'Enter task description (optional)',
                placeHolder: 'Task description...',
                validateInput: (value) => {
                    if (value && value.length > 1000) {
                        return 'Description must be less than 1000 characters';
                    }
                    return null;
                }
            });

            // Priority selection
            const priorityItems = [
                { label: '$(arrow-down) Low', value: 'low', description: 'Low priority task' },
                { label: '$(dash) Medium', value: 'medium', description: 'Medium priority task' },
                { label: '$(arrow-up) High', value: 'high', description: 'High priority task' },
                { label: '$(alert) Critical', value: 'critical', description: 'Critical priority task' }
            ];

            const selectedPriority = await vscode.window.showQuickPick(priorityItems, {
                placeHolder: 'Select task priority'
            });

            if (!selectedPriority) return;

            // Type selection
            const typeItems = [
                { label: '$(star) Feature', value: 'feature', description: 'New feature development' },
                { label: '$(bug) Bug', value: 'bug', description: 'Bug fix or issue resolution' },
                { label: '$(arrow-up) Improvement', value: 'improvement', description: 'Enhancement or optimization' },
                { label: '$(book) Documentation', value: 'documentation', description: 'Documentation task' },
                { label: '$(beaker) Test', value: 'test', description: 'Testing or QA task' }
            ];

            const selectedType = await vscode.window.showQuickPick(typeItems, {
                placeHolder: 'Select task type'
            });

            if (!selectedType) return;

            // Optional: Assignee input
            const assignee = await vscode.window.showInputBox({
                prompt: 'Enter assignee (optional)',
                placeHolder: 'john.doe@example.com or John Doe',
                validateInput: (value) => {
                    if (value && value.length > 100) {
                        return 'Assignee must be less than 100 characters';
                    }
                    return null;
                }
            });

            // Optional: Due date input
            const dueDateInput = await vscode.window.showInputBox({
                prompt: 'Enter due date (optional)',
                placeHolder: 'YYYY-MM-DD or leave empty',
                validateInput: (value) => {
                    if (value && value.trim().length > 0) {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) {
                            return 'Please enter a valid date in YYYY-MM-DD format';
                        }
                        if (date < new Date()) {
                            return 'Due date cannot be in the past';
                        }
                    }
                    return null;
                }
            });

            // Optional: Estimated hours
            const estimatedHoursInput = await vscode.window.showInputBox({
                prompt: 'Enter estimated hours (optional)',
                placeHolder: '8 or 8.5',
                validateInput: (value) => {
                    if (value && value.trim().length > 0) {
                        const hours = parseFloat(value);
                        if (isNaN(hours) || hours <= 0) {
                            return 'Please enter a valid positive number';
                        }
                        if (hours > 1000) {
                            return 'Estimated hours cannot exceed 1000';
                        }
                    }
                    return null;
                }
            });

            // Create task
            const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                title: title.trim(),
                description: description?.trim() || '',
                status: 'todo',
                priority: selectedPriority.value as Task['priority'],
                type: selectedType.value as Task['type'],
                project_id: selectedProject.id,
                assignee: assignee?.trim() || undefined,
                due_date: dueDateInput?.trim() || undefined,
                estimated_hours: estimatedHoursInput ? parseFloat(estimatedHoursInput) : undefined
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating task...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Validating task data...' });
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                progress.report({ increment: 30, message: 'Creating task...' });
                
                const createdTask = await this.apiService.createTask(newTask);
                
                progress.report({ increment: 70, message: 'Refreshing task list...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Task created successfully!' });
                
                vscode.window.showInformationMessage(
                    `Task "${title}" created successfully!`,
                    'View Task',
                    'Create Another',
                    'Open Web UI'
                ).then(selection => {
                    if (selection === 'View Task') {
                        this.viewTaskDetails(createdTask);
                    } else if (selection === 'Create Another') {
                        this.createTask(selectedProject ?? undefined);
                    } else if (selection === 'Open Web UI') {
                        vscode.commands.executeCommand('projectMaster.openWebUI');
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to create task', error);
            vscode.window.showErrorMessage('Failed to create task. Please try again.');
        }
    }

    private async editTask(task: Task): Promise<void> {
        try {
            this.logger.info(`Editing task: ${task.title}`);
            
            // What to edit selection
            const editOptions = await vscode.window.showQuickPick([
                { label: '$(edit) Title & Description', value: 'basic', description: 'Edit title and description' },
                { label: '$(tag) Priority & Type', value: 'classification', description: 'Edit priority and type' },
                { label: '$(person) Assignment', value: 'assignment', description: 'Edit assignee and due date' },
                { label: '$(clock) Time Tracking', value: 'time', description: 'Edit estimated and actual hours' },
                { label: '$(list-unordered) All Properties', value: 'all', description: 'Edit all task properties' }
            ], {
                placeHolder: 'What would you like to edit?'
            });

            if (!editOptions) return;

            let updatedTask: Partial<Task> = {};

            if (editOptions.value === 'basic' || editOptions.value === 'all') {
                // Edit title
                const title = await vscode.window.showInputBox({
                    prompt: 'Edit task title',
                    value: task.title,
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Task title is required';
                        }
                        if (value.length > 200) {
                            return 'Task title must be less than 200 characters';
                        }
                        return null;
                    }
                });

                if (!title) return;
                updatedTask.title = title.trim();

                // Edit description
                const description = await vscode.window.showInputBox({
                    prompt: 'Edit task description',
                    value: task.description,
                    validateInput: (value) => {
                        if (value && value.length > 1000) {
                            return 'Description must be less than 1000 characters';
                        }
                        return null;
                    }
                });

                if (description === undefined) return;
                updatedTask.description = description.trim();
            }

            if (editOptions.value === 'classification' || editOptions.value === 'all') {
                // Edit priority
                const priorityItems = [
                    { label: '$(arrow-down) Low', value: 'low', picked: task.priority === 'low' },
                    { label: '$(dash) Medium', value: 'medium', picked: task.priority === 'medium' },
                    { label: '$(arrow-up) High', value: 'high', picked: task.priority === 'high' },
                    { label: '$(alert) Critical', value: 'critical', picked: task.priority === 'critical' }
                ];

                const selectedPriority = await vscode.window.showQuickPick(priorityItems, {
                    placeHolder: `Current priority: ${task.priority}`
                });

                if (!selectedPriority) return;
                updatedTask.priority = selectedPriority.value as Task['priority'];

                // Edit type
                const typeItems = [
                    { label: '$(star) Feature', value: 'feature', picked: task.type === 'feature' },
                    { label: '$(bug) Bug', value: 'bug', picked: task.type === 'bug' },
                    { label: '$(arrow-up) Improvement', value: 'improvement', picked: task.type === 'improvement' },
                    { label: '$(book) Documentation', value: 'documentation', picked: task.type === 'documentation' },
                    { label: '$(beaker) Test', value: 'test', picked: task.type === 'test' }
                ];

                const selectedType = await vscode.window.showQuickPick(typeItems, {
                    placeHolder: `Current type: ${task.type}`
                });

                if (!selectedType) return;
                updatedTask.type = selectedType.value as Task['type'];
            }

            if (editOptions.value === 'assignment' || editOptions.value === 'all') {
                // Edit assignee
                const assignee = await vscode.window.showInputBox({
                    prompt: 'Edit assignee',
                    value: task.assignee || '',
                    placeHolder: 'john.doe@example.com or John Doe',
                    validateInput: (value) => {
                        if (value && value.length > 100) {
                            return 'Assignee must be less than 100 characters';
                        }
                        return null;
                    }
                });

                if (assignee === undefined) return;
                updatedTask.assignee = assignee.trim() || undefined;

                // Edit due date
                const dueDateInput = await vscode.window.showInputBox({
                    prompt: 'Edit due date',
                    value: task.due_date || '',
                    placeHolder: 'YYYY-MM-DD or leave empty',
                    validateInput: (value) => {
                        if (value && value.trim().length > 0) {
                            const date = new Date(value);
                            if (isNaN(date.getTime())) {
                                return 'Please enter a valid date in YYYY-MM-DD format';
                            }
                        }
                        return null;
                    }
                });

                if (dueDateInput === undefined) return;
                updatedTask.due_date = dueDateInput.trim() || undefined;
            }

            if (editOptions.value === 'time' || editOptions.value === 'all') {
                // Edit estimated hours
                const estimatedHoursInput = await vscode.window.showInputBox({
                    prompt: 'Edit estimated hours',
                    value: task.estimated_hours?.toString() || '',
                    placeHolder: '8 or 8.5',
                    validateInput: (value) => {
                        if (value && value.trim().length > 0) {
                            const hours = parseFloat(value);
                            if (isNaN(hours) || hours <= 0) {
                                return 'Please enter a valid positive number';
                            }
                            if (hours > 1000) {
                                return 'Estimated hours cannot exceed 1000';
                            }
                        }
                        return null;
                    }
                });

                if (estimatedHoursInput === undefined) return;
                updatedTask.estimated_hours = estimatedHoursInput.trim() ? parseFloat(estimatedHoursInput) : undefined;

                // Edit actual hours
                const actualHoursInput = await vscode.window.showInputBox({
                    prompt: 'Edit actual hours',
                    value: task.actual_hours?.toString() || '',
                    placeHolder: '6 or 6.5',
                    validateInput: (value) => {
                        if (value && value.trim().length > 0) {
                            const hours = parseFloat(value);
                            if (isNaN(hours) || hours < 0) {
                                return 'Please enter a valid non-negative number';
                            }
                            if (hours > 1000) {
                                return 'Actual hours cannot exceed 1000';
                            }
                        }
                        return null;
                    }
                });

                if (actualHoursInput === undefined) return;
                updatedTask.actual_hours = actualHoursInput.trim() ? parseFloat(actualHoursInput) : undefined;
            }

            // Update task
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating task...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Validating changes...' });
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                progress.report({ increment: 40, message: 'Updating task...' });
                
                await this.apiService.updateTask(task.id, updatedTask);
                
                progress.report({ increment: 80, message: 'Refreshing task list...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Task updated successfully!' });
                
                vscode.window.showInformationMessage(`Task "${updatedTask.title || task.title}" updated successfully!`);
            });

        } catch (error) {
            this.logger.error('Failed to edit task', error);
            vscode.window.showErrorMessage('Failed to update task. Please try again.');
        }
    }

    private async deleteTask(task: Task): Promise<void> {
        try {
            this.logger.info(`Deleting task: ${task.title}`);
            
            // Confirmation dialog
            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to delete task "${task.title}"?`,
                {
                    modal: true,
                    detail: 'This action cannot be undone. All comments and time tracking data will be permanently deleted.'
                },
                'Delete Task',
                'Cancel'
            );

            if (confirmation !== 'Delete Task') return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting task...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Preparing deletion...' });
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                progress.report({ increment: 40, message: 'Deleting task data...' });
                
                await this.apiService.deleteTask(task.id);
                
                progress.report({ increment: 80, message: 'Updating task list...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Task deleted successfully!' });
                
                vscode.window.showInformationMessage(`Task "${task.title}" deleted successfully.`);
            });

        } catch (error) {
            this.logger.error('Failed to delete task', error);
            vscode.window.showErrorMessage('Failed to delete task. Please try again.');
        }
    }

    private async duplicateTask(task: Task): Promise<void> {
        try {
            this.logger.info(`Duplicating task: ${task.title}`);
            
            // Get new title for duplicate
            const newTitle = await vscode.window.showInputBox({
                prompt: 'Enter title for duplicated task',
                value: `${task.title} (Copy)`,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Task title is required';
                    }
                    if (value.length > 200) {
                        return 'Task title must be less than 200 characters';
                    }
                    return null;
                }
            });

            if (!newTitle) return;

            // Options for what to duplicate
            const duplicateOptions = await vscode.window.showQuickPick([
                {
                    label: '$(copy) Basic Properties',
                    description: 'Copy title, description, priority, and type',
                    value: 'basic'
                },
                {
                    label: '$(person) Include Assignment',
                    description: 'Copy basic properties + assignee and due date',
                    value: 'with-assignment'
                },
                {
                    label: '$(clock) Include Time Tracking',
                    description: 'Copy all properties including time estimates',
                    value: 'with-time'
                }
            ], {
                placeHolder: 'What would you like to duplicate?'
            });

            if (!duplicateOptions) return;

            // Create duplicate task
            const duplicateTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                title: newTitle.trim(),
                description: task.description,
                status: 'todo', // New tasks start as todo
                priority: task.priority,
                type: task.type,
                project_id: task.project_id
            };

            if (duplicateOptions.value === 'with-assignment' || duplicateOptions.value === 'with-time') {
                duplicateTask.assignee = task.assignee;
                duplicateTask.due_date = task.due_date;
            }

            if (duplicateOptions.value === 'with-time') {
                duplicateTask.estimated_hours = task.estimated_hours;
                // Don't copy actual_hours as it's work already done
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Duplicating task...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Creating task copy...' });
                
                const createdTask = await this.apiService.createTask(duplicateTask);
                
                progress.report({ increment: 70, message: 'Refreshing task list...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Task duplicated successfully!' });
                
                vscode.window.showInformationMessage(
                    `Task "${newTitle}" created as a copy of "${task.title}"!`,
                    'View New Task',
                    'Edit New Task'
                ).then(selection => {
                    if (selection === 'View New Task') {
                        this.viewTaskDetails(createdTask);
                    } else if (selection === 'Edit New Task') {
                        this.editTask(createdTask);
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to duplicate task', error);
            vscode.window.showErrorMessage('Failed to duplicate task. Please try again.');
        }
    }

    private async changeTaskStatus(task: Task): Promise<void> {
        try {
            this.logger.info(`Changing status for task: ${task.title}`);
            
            const statusItems = [
                { 
                    label: '$(circle-outline) To Do', 
                    value: 'todo', 
                    description: 'Task is ready to be started',
                    picked: task.status === 'todo'
                },
                { 
                    label: '$(sync) In Progress', 
                    value: 'in_progress', 
                    description: 'Task is currently being worked on',
                    picked: task.status === 'in_progress'
                },
                { 
                    label: '$(eye) Review', 
                    value: 'review', 
                    description: 'Task is ready for review',
                    picked: task.status === 'review'
                },
                { 
                    label: '$(check) Done', 
                    value: 'done', 
                    description: 'Task has been completed',
                    picked: task.status === 'done'
                },
                { 
                    label: '$(x) Cancelled', 
                    value: 'cancelled', 
                    description: 'Task has been cancelled',
                    picked: task.status === 'cancelled'
                }
            ];

            const selectedStatus = await vscode.window.showQuickPick(statusItems, {
                placeHolder: `Current status: ${this.getStatusText(task.status)}`,
                matchOnDescription: true
            });

            if (!selectedStatus || selectedStatus.value === task.status) return;

            // Special handling for status transitions
            let additionalUpdates: Partial<Task> = {};

            if (selectedStatus.value === 'done' && !task.actual_hours && task.estimated_hours) {
                const recordActualTime = await vscode.window.showQuickPick([
                    { label: 'Yes', value: true, description: 'Record actual time spent' },
                    { label: 'No', value: false, description: 'Mark as done without time tracking' }
                ], {
                    placeHolder: 'Would you like to record actual time spent on this task?'
                });

                if (recordActualTime?.value) {
                    const actualHours = await vscode.window.showInputBox({
                        prompt: 'Enter actual hours spent',
                        value: task.estimated_hours?.toString() || '',
                        validateInput: (value) => {
                            if (value && value.trim().length > 0) {
                                const hours = parseFloat(value);
                                if (isNaN(hours) || hours < 0) {
                                    return 'Please enter a valid non-negative number';
                                }
                            }
                            return null;
                        }
                    });

                    if (actualHours) {
                        additionalUpdates.actual_hours = parseFloat(actualHours);
                    }
                }
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating task status...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Updating status...' });
                
                await this.apiService.updateTask(task.id, { 
                    status: selectedStatus.value as Task['status'],
                    ...additionalUpdates
                });
                
                progress.report({ increment: 70, message: 'Refreshing task list...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Status updated successfully!' });
                
                vscode.window.showInformationMessage(
                    `Task "${task.title}" status changed to ${selectedStatus.label.replace(/\$\([^)]+\)\s*/, '')}.`
                );
            });

        } catch (error) {
            this.logger.error('Failed to change task status', error);
            vscode.window.showErrorMessage('Failed to update task status. Please try again.');
        }
    }

    private async changeTaskPriority(task: Task): Promise<void> {
        try {
            this.logger.info(`Changing priority for task: ${task.title}`);
            
            const priorityItems = [
                { label: '$(arrow-down) Low', value: 'low', picked: task.priority === 'low' },
                { label: '$(dash) Medium', value: 'medium', picked: task.priority === 'medium' },
                { label: '$(arrow-up) High', value: 'high', picked: task.priority === 'high' },
                { label: '$(alert) Critical', value: 'critical', picked: task.priority === 'critical' }
            ];

            const selectedPriority = await vscode.window.showQuickPick(priorityItems, {
                placeHolder: `Current priority: ${task.priority}`
            });

            if (!selectedPriority || selectedPriority.value === task.priority) return;

            await this.apiService.updateTask(task.id, { 
                priority: selectedPriority.value as Task['priority'] 
            });
            
            this.tasksProvider.refresh();
            
            vscode.window.showInformationMessage(
                `Task "${task.title}" priority changed to ${selectedPriority.label.replace(/\$\([^)]+\)\s*/, '')}.`
            );

        } catch (error) {
            this.logger.error('Failed to change task priority', error);
            vscode.window.showErrorMessage('Failed to update task priority. Please try again.');
        }
    }

    private async assignTask(task: Task): Promise<void> {
        try {
            this.logger.info(`Assigning task: ${task.title}`);
            
            const assignee = await vscode.window.showInputBox({
                prompt: 'Enter assignee',
                value: task.assignee || '',
                placeHolder: 'john.doe@example.com or John Doe (leave empty to unassign)',
                validateInput: (value) => {
                    if (value && value.length > 100) {
                        return 'Assignee must be less than 100 characters';
                    }
                    return null;
                }
            });

            if (assignee === undefined) return;

            await this.apiService.updateTask(task.id, { 
                assignee: assignee.trim() || undefined 
            });
            
            this.tasksProvider.refresh();
            
            const message = assignee.trim() 
                ? `Task "${task.title}" assigned to ${assignee.trim()}.`
                : `Task "${task.title}" unassigned.`;
            
            vscode.window.showInformationMessage(message);

        } catch (error) {
            this.logger.error('Failed to assign task', error);
            vscode.window.showErrorMessage('Failed to assign task. Please try again.');
        }
    }

    private async setTaskDueDate(task: Task): Promise<void> {
        try {
            this.logger.info(`Setting due date for task: ${task.title}`);
            
            const dueDateInput = await vscode.window.showInputBox({
                prompt: 'Enter due date',
                value: task.due_date || '',
                placeHolder: 'YYYY-MM-DD (leave empty to remove due date)',
                validateInput: (value) => {
                    if (value && value.trim().length > 0) {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) {
                            return 'Please enter a valid date in YYYY-MM-DD format';
                        }
                    }
                    return null;
                }
            });

            if (dueDateInput === undefined) return;

            await this.apiService.updateTask(task.id, { 
                due_date: dueDateInput.trim() || undefined 
            });
            
            this.tasksProvider.refresh();
            
            const message = dueDateInput.trim() 
                ? `Task "${task.title}" due date set to ${dueDateInput.trim()}.`
                : `Task "${task.title}" due date removed.`;
            
            vscode.window.showInformationMessage(message);

        } catch (error) {
            this.logger.error('Failed to set task due date', error);
            vscode.window.showErrorMessage('Failed to set task due date. Please try again.');
        }
    }

    private async addTimeTracking(task: Task): Promise<void> {
        try {
            this.logger.info(`Adding time tracking for task: ${task.title}`);
            
            const timeToAdd = await vscode.window.showInputBox({
                prompt: 'Enter hours to add to actual time',
                placeHolder: '2 or 2.5',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Please enter the number of hours';
                    }
                    const hours = parseFloat(value);
                    if (isNaN(hours) || hours <= 0) {
                        return 'Please enter a valid positive number';
                    }
                    if (hours > 24) {
                        return 'Cannot add more than 24 hours at once';
                    }
                    return null;
                }
            });

            if (!timeToAdd) return;

            const hoursToAdd = parseFloat(timeToAdd);
            const currentActualHours = task.actual_hours || 0;
            const newActualHours = currentActualHours + hoursToAdd;

            await this.apiService.updateTask(task.id, { 
                actual_hours: newActualHours 
            });
            
            this.tasksProvider.refresh();
            
            vscode.window.showInformationMessage(
                `Added ${hoursToAdd} hours to task "${task.title}". Total: ${newActualHours} hours.`
            );

        } catch (error) {
            this.logger.error('Failed to add time tracking', error);
            vscode.window.showErrorMessage('Failed to add time tracking. Please try again.');
        }
    }

    private async viewTaskDetails(task: Task): Promise<void> {
        try {
            this.logger.info(`Viewing details for task: ${task.title}`);
            
            // Get project information
            const project = this.projectsProvider.getProjectById(task.project_id);
            
            // Create detailed markdown content
            const taskDetails = `# ${task.title}

## Task Information
- **Status:** ${this.getStatusText(task.status)}
- **Priority:** ${this.getPriorityText(task.priority)}
- **Type:** ${this.getTypeText(task.type)}
- **Project:** ${project?.name || 'Unknown Project'}
- **Created:** ${new Date(task.created_at).toLocaleDateString()}
- **Last Updated:** ${new Date(task.updated_at).toLocaleDateString()}

## Description
${task.description || 'No description provided.'}

## Assignment & Timeline
- **Assignee:** ${task.assignee || 'Unassigned'}
- **Due Date:** ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}

## Time Tracking
- **Estimated Hours:** ${task.estimated_hours || 'Not estimated'}
- **Actual Hours:** ${task.actual_hours || 'No time logged'}
${task.estimated_hours && task.actual_hours ? `- **Progress:** ${Math.round((task.actual_hours / task.estimated_hours) * 100)}%` : ''}

${task.tags && task.tags.length > 0 ? `## Tags
${task.tags.map(tag => `- ${tag}`).join('\n')}
` : ''}

## Quick Actions
- [Edit Task](command:projectMaster.tasks.edit?${encodeURIComponent(JSON.stringify([task]))}) details
- [Change Status](command:projectMaster.tasks.changeStatus?${encodeURIComponent(JSON.stringify([task]))}) of task
- [Change Priority](command:projectMaster.tasks.changePriority?${encodeURIComponent(JSON.stringify([task]))}) of task
- [Add Time](command:projectMaster.tasks.addTime?${encodeURIComponent(JSON.stringify([task]))}) tracking
- [Add Comment](command:projectMaster.comments.add?${encodeURIComponent(JSON.stringify([task]))}) to task
- [Open Web UI](command:projectMaster.openWebUI) to manage task

---
*Task ID: ${task.id}*
*This is a read-only view. Use commands above or the web interface to make changes.*`;

            // Create and show document
            const doc = await vscode.workspace.openTextDocument({
                content: taskDetails,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside
            });

        } catch (error) {
            this.logger.error('Failed to view task details', error);
            vscode.window.showErrorMessage('Failed to open task details. Please try again.');
        }
    }

    private async exportTasks(): Promise<void> {
        try {
            this.logger.info('Exporting tasks...');
            
            // Get current tasks
            const tasks = this.tasksProvider.getAllTasks();
            
            if (tasks.length === 0) {
                vscode.window.showInformationMessage('No tasks to export.');
                return;
            }

            // Export format selection
            const formatOptions = await vscode.window.showQuickPick([
                {
                    label: '$(file-code) JSON',
                    description: 'Export as JSON file',
                    value: 'json'
                },
                {
                    label: '$(file-text) CSV',
                    description: 'Export as CSV file',
                    value: 'csv'
                },
                {
                    label: '$(markdown) Markdown',
                    description: 'Export as Markdown report',
                    value: 'markdown'
                }
            ], {
                placeHolder: 'Select export format'
            });

            if (!formatOptions) return;

            // Get save location
            const selectedProject = this.projectsProvider.getSelectedProject();
            const defaultName = selectedProject 
                ? `${selectedProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_tasks`
                : 'tasks_export';

            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${defaultName}.${formatOptions.value}`),
                filters: {
                    'JSON Files': ['json'],
                    'CSV Files': ['csv'],
                    'Markdown Files': ['md'],
                    'All Files': ['*']
                }
            });

            if (!saveUri) return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Exporting tasks...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Preparing export data...' });
                
                let exportContent: string;
                
                switch (formatOptions.value) {
                    case 'json':
                        exportContent = JSON.stringify({
                            tasks,
                            exportedAt: new Date().toISOString(),
                            exportedBy: 'VS Code Extension',
                            totalTasks: tasks.length
                        }, null, 2);
                        break;
                    
                    case 'csv':
                        const csvHeaders = 'Title,Status,Priority,Type,Project ID,Assignee,Due Date,Estimated Hours,Actual Hours,Created,Updated';
                        const csvRows = tasks.map(task => 
                            `"${task.title}","${task.status}","${task.priority}","${task.type}","${task.project_id}","${task.assignee || ''}","${task.due_date || ''}","${task.estimated_hours || ''}","${task.actual_hours || ''}","${task.created_at}","${task.updated_at}"`
                        );
                        exportContent = [csvHeaders, ...csvRows].join('\n');
                        break;
                    
                    case 'markdown':
                        exportContent = `# Tasks Export

**Exported:** ${new Date().toLocaleDateString()}
**Total Tasks:** ${tasks.length}

## Task Summary
${tasks.map(task => `
### ${task.title}
- **Status:** ${this.getStatusText(task.status)}
- **Priority:** ${this.getPriorityText(task.priority)}
- **Type:** ${this.getTypeText(task.type)}
- **Assignee:** ${task.assignee || 'Unassigned'}
- **Due Date:** ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}

${task.description || 'No description'}

---
`).join('\n')}

## Notes
This export was generated by the Project Master VS Code Extension.
`;
                        break;
                    
                    default:
                        throw new Error('Unsupported export format');
                }
                
                progress.report({ increment: 70, message: 'Writing file...' });
                
                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(exportContent, 'utf8'));
                
                progress.report({ increment: 100, message: 'Export completed!' });
                
                vscode.window.showInformationMessage(
                    `${tasks.length} tasks exported successfully!`,
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
            this.logger.error('Failed to export tasks', error);
            vscode.window.showErrorMessage('Failed to export tasks. Please try again.');
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'todo': return 'To Do';
            case 'in_progress': return 'In Progress';
            case 'review': return 'Review';
            case 'done': return 'Done';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    }

    private getPriorityText(priority: string): string {
        switch (priority) {
            case 'critical': return 'Critical';
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
            default: return priority;
        }
    }

    private getTypeText(type: string): string {
        switch (type) {
            case 'feature': return 'Feature';
            case 'bug': return 'Bug';
            case 'improvement': return 'Improvement';
            case 'documentation': return 'Documentation';
            case 'test': return 'Test';
            default: return type;
        }
    }
} 