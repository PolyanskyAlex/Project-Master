import * as vscode from 'vscode';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { Project, FunctionalBlock } from '../types';

interface ProjectTreeItem {
    type: 'project' | 'functionalBlock';
    project?: Project;
    functionalBlock?: FunctionalBlock;
    label: string;
    description?: string;
    tooltip?: string;
}

export class ProjectsProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private projects: Project[] = [];
    private functionalBlocks: FunctionalBlock[] = [];
    private selectedProject: Project | null = null;

    constructor(
        private apiService: IApiService,
        private logger: Logger
    ) {
        this.loadData();
    }

    refresh(): void {
        this.loadData();
        this._onDidChangeTreeData.fire();
    }

    selectProject(project: Project): void {
        this.selectedProject = project;
        this._onDidChangeTreeData.fire();
        
        // Notify other providers about project selection
        vscode.commands.executeCommand('projectMaster.projectSelected', project);
        this.logger.info(`Project selected: ${project.name}`);
    }

    getSelectedProject(): Project | null {
        return this.selectedProject;
    }

    getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
        if (element.type === 'project' && element.project) {
            const project = element.project;
            const item = new vscode.TreeItem(
                project.name, 
                vscode.TreeItemCollapsibleState.None
            );
            
            item.description = this.getProjectStatusText(project.status);
            item.tooltip = this.createProjectTooltip(project);
            item.contextValue = 'project';
            item.id = `project-${project.id}`;
            
            // Highlight selected project
            if (this.selectedProject && this.selectedProject.id === project.id) {
                item.resourceUri = vscode.Uri.parse(`project-master://selected/${project.id}`);
            }

            // Set icon based on status
            item.iconPath = this.getProjectIcon(project.status);

            // Add command to select project on click
            item.command = {
                command: 'projectMaster.selectProject',
                title: 'Select Project',
                arguments: [project]
            };

            return item;
        } else if (element.type === 'functionalBlock' && element.functionalBlock) {
            const block = element.functionalBlock;
            const item = new vscode.TreeItem(block.name, vscode.TreeItemCollapsibleState.Expanded);
            
            item.description = `${this.getProjectsCountForBlock(block.id)} projects`;
            item.tooltip = `Functional Block: ${block.name}\n${block.description || 'No description'}`;
            item.contextValue = 'functionalBlock';
            item.id = `block-${block.id}`;
            item.iconPath = new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.purple'));

            return item;
        }

        return new vscode.TreeItem('Unknown', vscode.TreeItemCollapsibleState.None);
    }

    getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]> {
        if (!element) {
            // Root level - show functional blocks and projects without blocks
            const items: ProjectTreeItem[] = [];
            
            // Add functional blocks
            this.functionalBlocks.forEach(block => {
                items.push({
                    type: 'functionalBlock',
                    functionalBlock: block,
                    label: block.name,
                    description: `${this.getProjectsCountForBlock(block.id)} projects`
                });
            });

            // Add projects without functional blocks
            const projectsWithoutBlocks = this.projects.filter(p => !p.functional_block_id);
            projectsWithoutBlocks.forEach(project => {
                items.push({
                    type: 'project',
                    project: project,
                    label: project.name,
                    description: this.getProjectStatusText(project.status)
                });
            });

            return Promise.resolve(items);
        } else if (element.type === 'functionalBlock' && element.functionalBlock) {
            // Show projects for this functional block
            const blockProjects = this.projects.filter(p => p.functional_block_id === element.functionalBlock!.id);
            const items: ProjectTreeItem[] = blockProjects.map(project => ({
                type: 'project',
                project: project,
                label: project.name,
                description: this.getProjectStatusText(project.status)
            }));

            return Promise.resolve(items);
        }

        return Promise.resolve([]);
    }

    private async loadData(): Promise<void> {
        try {
            this.logger.info('Loading projects and functional blocks...');
            
            // Load projects and functional blocks in parallel
            const [projects, functionalBlocks] = await Promise.all([
                this.apiService.getProjects(),
                this.apiService.getFunctionalBlocks()
            ]);

            this.projects = projects;
            this.functionalBlocks = functionalBlocks;
            
            this.logger.info(`Loaded ${this.projects.length} projects and ${this.functionalBlocks.length} functional blocks`);
        } catch (error) {
            this.logger.error('Failed to load projects data', error);
            this.projects = [];
            this.functionalBlocks = [];
            
            vscode.window.showErrorMessage(
                'Failed to load projects. Please check your API configuration.',
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

    private getProjectStatusText(status: string): string {
        switch (status) {
            case 'active': return 'Active';
            case 'completed': return 'Completed';
            case 'on_hold': return 'On Hold';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    }

    private getProjectIcon(status: string): vscode.ThemeIcon {
        switch (status) {
            case 'active':
                return new vscode.ThemeIcon('play', new vscode.ThemeColor('charts.green'));
            case 'completed':
                return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.blue'));
            case 'on_hold':
                return new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
            case 'cancelled':
                return new vscode.ThemeIcon('x', new vscode.ThemeColor('charts.red'));
            default:
                return new vscode.ThemeIcon('folder');
        }
    }

    private getProjectsCountForBlock(blockId: string): number {
        return this.projects.filter(p => p.functional_block_id === blockId).length;
    }

    private createProjectTooltip(project: Project): string {
        const block = this.functionalBlocks.find(b => b.id === project.functional_block_id);
        const blockName = block ? block.name : 'No functional block';
        
        return `Project: ${project.name}
Status: ${this.getProjectStatusText(project.status)}
Functional Block: ${blockName}
Created: ${new Date(project.created_at).toLocaleDateString()}
${project.description ? `\nDescription: ${project.description}` : ''}`;
    }

    // Public methods for external access
    getProjects(): Project[] {
        return this.projects;
    }

    getProjectById(projectId: string): Project | undefined {
        return this.projects.find(project => project.id === projectId);
    }

    getFunctionalBlocks(): FunctionalBlock[] {
        return this.functionalBlocks;
    }

    getAllProjects(): Project[] {
        return [...this.projects];
    }
} 