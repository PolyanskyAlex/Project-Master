import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    it('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('project-master.project-master-extension'));
    });

    it('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('project-master.project-master-extension');
        if (extension) {
            await extension.activate();
            assert.strictEqual(extension.isActive, true);
        }
    });

    it('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'projectMaster.setupWizard',
            'projectMaster.quickSetup',
            'projectMaster.testConnection',
            'projectMaster.showStatus',
            'projectMaster.refreshProjects',
            'projectMaster.refreshTasks',
            'projectMaster.syncPlan',
            'projectMaster.createProject',
            'projectMaster.createTask',
            'projectMaster.openWebUI'
        ];

        expectedCommands.forEach(command => {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        });
    });

    it('Should have configuration properties', () => {
        const config = vscode.workspace.getConfiguration('projectMaster');
        
        // Check that configuration properties exist
        assert.notStrictEqual(config.get('apiUrl'), undefined);
        assert.notStrictEqual(config.get('apiKey'), undefined);
        assert.notStrictEqual(config.get('webUrl'), undefined);
        assert.notStrictEqual(config.get('autoRefresh'), undefined);
        assert.notStrictEqual(config.get('enableNotifications'), undefined);
    });

    it('Should have tree view providers', () => {
        // Check that tree views are registered
        const projectsView = vscode.window.createTreeView('projectMasterProjects', {
            treeDataProvider: {
                getTreeItem: () => new vscode.TreeItem('test'),
                getChildren: () => []
            }
        });
        
        assert.ok(projectsView);
        projectsView.dispose();
    });
}); 