import * as assert from 'assert';
import * as vscode from 'vscode';
import { ProjectsProvider } from '../../../providers/ProjectsProvider';
import { Logger } from '../../../utils/Logger';
import { Project } from '../../../types';

/**
 * Регрессионный тест для бага B016_EXT - циркулярные ссылки при передаче объектов
 * Этот тест предотвращает повторение ошибки "An object could not be cloned"
 */
suite('ProjectsProvider Regression Tests - B016_EXT', () => {
    let mockApiService: any;
    let logger: Logger;
    let projectsProvider: ProjectsProvider;

    const mockProject: Project = {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        status: 'active',
        functional_block_id: 'fb1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    };

    setup(() => {
        mockApiService = {
            getProjects: () => Promise.resolve([mockProject]),
            getFunctionalBlocks: () => Promise.resolve([])
        };
        
        logger = new Logger();
        projectsProvider = new ProjectsProvider(mockApiService, logger);
    });

    test('B016_EXT: selectProject should not cause circular reference errors', async () => {
        // Setup
        await projectsProvider.refresh();
        
        // Test: Selecting a project should not throw circular reference error
        try {
            projectsProvider.selectProject(mockProject);
            
            // Verify project is selected
            const selectedProject = projectsProvider.getSelectedProject();
            assert.strictEqual(selectedProject?.id, mockProject.id);
            
        } catch (error) {
            if (error instanceof Error) {
                // These errors should NOT occur after the fix
                assert.ok(!error.message.includes('An object could not be cloned'));
                assert.ok(!error.message.includes('Maximum call stack size exceeded'));
                assert.ok(!error.message.includes('circular'));
            }
            throw error;
        }
    });

    test('B016_EXT: TreeItem command should use project ID not full object', () => {
        // Get tree item for a project
        const treeItem = projectsProvider.getTreeItem({
            type: 'project',
            project: mockProject,
            label: mockProject.name
        });

        // Verify command uses project ID, not full object
        assert.ok(treeItem.command);
        assert.strictEqual(treeItem.command.command, 'projectMaster.selectProject');
        assert.ok(Array.isArray(treeItem.command.arguments));
        assert.strictEqual(treeItem.command.arguments![0], mockProject.id);
        
        // Ensure it's NOT passing the full project object
        assert.notStrictEqual(treeItem.command.arguments![0], mockProject);
    });

    test('B016_EXT: executeCommand with project ID should work', async () => {
        // Setup
        await projectsProvider.refresh();
        
        // Mock vscode.commands.executeCommand to capture what's being passed
        let capturedArgs: any[] = [];
        const originalExecuteCommand = vscode.commands.executeCommand;
        
        try {
            // @ts-ignore - Mock for testing
            vscode.commands.executeCommand = (command: string, ...args: any[]) => {
                capturedArgs = args;
                return Promise.resolve();
            };
            
            // Execute selectProject
            projectsProvider.selectProject(mockProject);
            
            // Verify that only project ID is passed, not full object
            assert.strictEqual(capturedArgs.length, 1);
            assert.strictEqual(capturedArgs[0], mockProject.id);
            assert.notStrictEqual(typeof capturedArgs[0], 'object');
            
        } finally {
            // Restore original function
            // @ts-ignore
            vscode.commands.executeCommand = originalExecuteCommand;
        }
    });

    test('B016_EXT: Project lookup by ID should be reliable', () => {
        // Test project lookup functionality
        const foundProject = projectsProvider.getProjectById(mockProject.id);
        assert.ok(foundProject);
        assert.strictEqual(foundProject.id, mockProject.id);
        assert.strictEqual(foundProject.name, mockProject.name);
        
        // Test non-existent project
        const notFound = projectsProvider.getProjectById('non-existent');
        assert.strictEqual(notFound, undefined);
    });

    test('B016_EXT: Serialization safety check', () => {
        // This test ensures that our objects can be safely serialized
        // which is required for VS Code command passing
        
        try {
            // Test that project ID can be serialized (should work)
            const serializedId = JSON.stringify(mockProject.id);
            const deserializedId = JSON.parse(serializedId);
            assert.strictEqual(deserializedId, mockProject.id);
            
            // Test that project object can be serialized without circular refs
            const serializedProject = JSON.stringify(mockProject);
            const deserializedProject = JSON.parse(serializedProject);
            assert.strictEqual(deserializedProject.id, mockProject.id);
            
        } catch (error) {
            if (error instanceof Error) {
                assert.fail(`Serialization should not fail: ${error.message}`);
            }
        }
    });
}); 