import * as vscode from 'vscode';
import { ApiService } from '../services/ApiService';
import { Logger } from '../utils/Logger';
import { Task, Project } from '../types';

interface ProjectPlan {
    id: string;
    project_id: string;
    task_ids: string[];
    created_at: string;
    updated_at: string;
}

interface PlanTreeItem {
    type: 'plan' | 'task';
    plan?: ProjectPlan;
    task?: Task;
    label: string;
    description?: string;
    order?: number;
}

export class PlanProvider implements vscode.TreeDataProvider<PlanTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PlanTreeItem | undefined | null | void> = new vscode.EventEmitter<PlanTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PlanTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private plan: ProjectPlan | null = null;
    private planTasks: Task[] = [];
    private selectedProject: Project | null = null;

    constructor(
        private apiService: ApiService,
        private logger: Logger
    ) {
        // Note: projectMaster.projectSelected command is registered in extension.ts
        // This provider listens for project selection changes through setSelectedProject method
    }

    refresh(): void {
        this.loadPlan();
        this._onDidChangeTreeData.fire();
    }

    setSelectedProject(project: Project | null): void {
        this.selectedProject = project;
        this.logger.info(`Plan view: Project ${project ? 'selected: ' + project.name : 'deselected'}`);
        this.refresh();
    }

    getSelectedProject(): Project | null {
        return this.selectedProject;
    }

    getTreeItem(element: PlanTreeItem): vscode.TreeItem {
        if (element.type === 'plan' && element.plan) {
            const plan = element.plan;
            const item = new vscode.TreeItem(
                `Development Plan`,
                vscode.TreeItemCollapsibleState.Expanded
            );
            
            item.description = `${this.planTasks.length} tasks`;
            item.tooltip = `Development Plan for ${this.selectedProject?.name || 'Unknown Project'}
Tasks: ${this.planTasks.length}
Created: ${new Date(plan.created_at).toLocaleDateString()}
Updated: ${new Date(plan.updated_at).toLocaleDateString()}`;
            item.contextValue = 'plan';
            item.id = `plan-${plan.id}`;
            item.iconPath = new vscode.ThemeIcon('list-ordered', new vscode.ThemeColor('charts.blue'));

            return item;
        } else if (element.type === 'task' && element.task) {
            const task = element.task;
            const item = new vscode.TreeItem(
                `${element.order}. ${task.title}`,
                vscode.TreeItemCollapsibleState.None
            );
            
            item.description = `${this.getStatusText(task.status)} | ${this.getPriorityText(task.priority)}`;
            item.tooltip = this.createTaskTooltip(task, element.order!);
            item.contextValue = 'planTask';
            item.id = `plan-task-${task.id}`;
            
            // Set icon based on task status and type
            item.iconPath = this.getTaskIcon(task);

            // Add command to open task
            item.command = {
                command: 'projectMaster.openTask',
                title: 'Open Task',
                arguments: [task]
            };

            return item;
        }

        return new vscode.TreeItem('Unknown', vscode.TreeItemCollapsibleState.None);
    }

    getChildren(element?: PlanTreeItem): Thenable<PlanTreeItem[]> {
        if (!element) {
            // Root level
            if (!this.selectedProject) {
                return Promise.resolve([]);
            }

            if (this.plan && this.planTasks.length > 0) {
                // Show plan with tasks
                return Promise.resolve([{
                    type: 'plan',
                    plan: this.plan,
                    label: 'Development Plan',
                    description: `${this.planTasks.length} tasks`
                }]);
            } else {
                // No plan or empty plan
                return Promise.resolve([]);
            }
        } else if (element.type === 'plan' && element.plan) {
            // Show tasks in plan order
            const items: PlanTreeItem[] = this.planTasks.map((task, index) => ({
                type: 'task',
                task: task,
                label: `${index + 1}. ${task.title}`,
                description: `${this.getStatusText(task.status)} | ${this.getPriorityText(task.priority)}`,
                order: index + 1
            }));

            return Promise.resolve(items);
        }

        return Promise.resolve([]);
    }

    private async loadPlan(): Promise<void> {
        if (!this.selectedProject) {
            this.plan = null;
            this.planTasks = [];
            return;
        }

        try {
            this.logger.debug('Loading development plan...', { projectId: this.selectedProject.id });
            
            // Load plan and tasks
            const [allTasks] = await Promise.all([
                this.apiService.getTasks()
            ]);

            // For now, create a mock plan since API doesn't have getProjectPlan yet
            this.plan = {
                id: `plan-${this.selectedProject.id}`,
                project_id: this.selectedProject.id,
                task_ids: allTasks
                    .filter(task => task.project_id === this.selectedProject!.id)
                    .map(task => task.id),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (this.plan.task_ids.length > 0) {
                // Filter and order tasks according to plan
                this.planTasks = this.plan.task_ids
                    .map((taskId: string) => allTasks.find((task: Task) => task.id === taskId))
                    .filter((task: Task | undefined): task is Task => task !== undefined);
                
                this.logger.info(`Loaded development plan with ${this.planTasks.length} tasks for project ${this.selectedProject.name}`);
            } else {
                this.planTasks = [];
                this.logger.info(`No development plan found for project ${this.selectedProject.name}`);
            }
        } catch (error) {
            this.logger.error('Failed to load development plan', error);
            this.plan = null;
            this.planTasks = [];
            
            vscode.window.showErrorMessage(
                'Failed to load development plan. Please check your API configuration.',
                'Open Settings',
                'Retry'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'projectMaster');
                } else if (selection === 'Retry') {
                    this.refresh();
                }
            });
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

    private getTaskIcon(task: Task): vscode.ThemeIcon {
        // Primary icon based on status
        let iconName: string;
        let color: vscode.ThemeColor;

        switch (task.status) {
            case 'todo':
                iconName = 'circle-outline';
                color = new vscode.ThemeColor('charts.gray');
                break;
            case 'in_progress':
                iconName = 'sync';
                color = new vscode.ThemeColor('charts.blue');
                break;
            case 'review':
                iconName = 'eye';
                color = new vscode.ThemeColor('charts.orange');
                break;
            case 'done':
                iconName = 'check';
                color = new vscode.ThemeColor('charts.green');
                break;
            case 'cancelled':
                iconName = 'x';
                color = new vscode.ThemeColor('charts.red');
                break;
            default:
                iconName = 'circle';
                color = new vscode.ThemeColor('charts.gray');
        }

        return new vscode.ThemeIcon(iconName, color);
    }

    private createTaskTooltip(task: Task, order: number): string {
        return `Order: ${order}
Task: ${task.title}
Status: ${this.getStatusText(task.status)}
Priority: ${this.getPriorityText(task.priority)}
Type: ${task.type}
Created: ${new Date(task.created_at).toLocaleDateString()}
${task.description ? `\nDescription: ${task.description}` : ''}`;
    }

    // Public methods for external access
    getPlan(): ProjectPlan | null {
        return this.plan;
    }

    getPlanTasks(): Task[] {
        return [...this.planTasks];
    }

    getTaskByOrder(order: number): Task | undefined {
        return this.planTasks[order - 1];
    }

    getTaskOrder(taskId: string): number | undefined {
        const index = this.planTasks.findIndex(task => task.id === taskId);
        return index >= 0 ? index + 1 : undefined;
    }

    async syncPlan(): Promise<void> {
        if (!this.selectedProject) {
            vscode.window.showWarningMessage('Please select a project first.');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Syncing development plan...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                await this.loadPlan();
                
                progress.report({ increment: 100 });
                
                vscode.window.showInformationMessage(
                    `Development plan synced successfully! ${this.planTasks.length} tasks loaded.`
                );
            });
        } catch (error) {
            this.logger.error('Failed to sync development plan', error);
            vscode.window.showErrorMessage('Failed to sync development plan. Please try again.');
        }
    }
} 