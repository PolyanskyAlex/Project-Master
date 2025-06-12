import * as vscode from 'vscode';
import { ApiService } from '../services/ApiService';
import { Logger } from '../utils/Logger';
import { Task, Project } from '../types';

type TaskTreeItem = TaskStatusItem | TaskItem;

export class TasksProvider implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private tasks: Task[] = [];
    private selectedProject: Project | null = null;

    constructor(
        private apiService: ApiService,
        private logger: Logger
    ) {
        // Listen for project selection events
        vscode.commands.registerCommand('projectMaster.projectSelected', (project: Project) => {
            this.setSelectedProject(project);
        });
    }

    refresh(): void {
        this.loadTasks();
        this._onDidChangeTreeData.fire();
    }

    setSelectedProject(project: Project | null): void {
        this.selectedProject = project;
        this.logger.info(`Tasks view: Project ${project ? 'selected: ' + project.name : 'deselected'}`);
        this.refresh();
    }

    getSelectedProject(): Project | null {
        return this.selectedProject;
    }

    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
        if (!element) {
            // Root level - return tasks grouped by status
            const groupedTasks = this.groupTasksByStatus();
            return Promise.resolve(Object.entries(groupedTasks).map(([status, tasks]) => 
                new TaskStatusItem(status, tasks)
            ));
        } else if (element instanceof TaskStatusItem) {
            // Return tasks for this status
            return Promise.resolve(element.tasks.map(task => new TaskItem(task)));
        }
        
        return Promise.resolve([]);
    }

    private async loadTasks(): Promise<void> {
        try {
            this.logger.debug('Loading tasks...', { projectId: this.selectedProject?.id });
            
            if (this.selectedProject) {
                // Filter tasks by project on client side for now
                const allTasks = await this.apiService.getTasks();
                this.tasks = allTasks.filter(task => task.project_id === this.selectedProject!.id);
                this.logger.info(`Loaded ${this.tasks.length} tasks for project ${this.selectedProject.name}`);
            } else {
                this.tasks = await this.apiService.getTasks();
                this.logger.info(`Loaded ${this.tasks.length} tasks`);
            }
        } catch (error) {
            this.logger.error('Failed to load tasks', error);
            this.tasks = [];
            
            vscode.window.showErrorMessage(
                'Failed to load tasks. Please check your API configuration.',
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

    private groupTasksByStatus(): Record<string, Task[]> {
        const groups: Record<string, Task[]> = {
            'todo': [],
            'in_progress': [],
            'review': [],
            'done': [],
            'cancelled': []
        };

        this.tasks.forEach(task => {
            if (groups[task.status]) {
                groups[task.status].push(task);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    }

    getTask(id: string): Task | undefined {
        return this.tasks.find(t => t.id === id);
    }

    getAllTasks(): Task[] {
        return [...this.tasks];
    }
}

export class TaskStatusItem extends vscode.TreeItem {
    constructor(
        public readonly status: string,
        public readonly tasks: Task[]
    ) {
        super(
            `${status.replace('_', ' ').toUpperCase()} (${tasks.length})`,
            vscode.TreeItemCollapsibleState.Expanded
        );

        this.contextValue = 'taskStatus';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

export class TaskItem extends vscode.TreeItem {
    constructor(
        public readonly task: Task
    ) {
        super(task.title, vscode.TreeItemCollapsibleState.None);

        this.tooltip = `${task.title}\n${task.description}\nStatus: ${task.status}\nPriority: ${task.priority}\nType: ${task.type}`;
        this.description = `${task.priority} | ${task.type}`;
        this.contextValue = 'task';

        // Set icon based on type and priority
        this.iconPath = this.getTaskIcon(task);

        // Add command to open task
        this.command = {
            command: 'projectMaster.openTask',
            title: 'Open Task',
            arguments: [task.id]
        };
    }

    private getTaskIcon(task: Task): vscode.ThemeIcon {
        // Priority colors
        let color: vscode.ThemeColor | undefined;
        switch (task.priority) {
            case 'critical':
                color = new vscode.ThemeColor('charts.red');
                break;
            case 'high':
                color = new vscode.ThemeColor('charts.orange');
                break;
            case 'medium':
                color = new vscode.ThemeColor('charts.yellow');
                break;
            case 'low':
                color = new vscode.ThemeColor('charts.blue');
                break;
        }

        // Type icons
        let iconName: string;
        switch (task.type) {
            case 'bug':
                iconName = 'bug';
                break;
            case 'feature':
                iconName = 'star';
                break;
            case 'improvement':
                iconName = 'arrow-up';
                break;
            case 'documentation':
                iconName = 'book';
                break;
            case 'test':
                iconName = 'beaker';
                break;
            default:
                iconName = 'circle';
        }

        return new vscode.ThemeIcon(iconName, color);
    }
} 