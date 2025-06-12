import * as assert from 'assert';
import * as sinon from 'sinon';
import { McpParser } from '../../../utils/McpParser';

describe('McpParser', () => {
    let mcpParser: McpParser;

    beforeEach(() => {
        mcpParser = new McpParser();
    });

    describe('Basic Parsing', () => {
        it('should parse simple MCP content', () => {
            const content = JSON.stringify({
                version: '1.0',
                name: 'Test MCP File',
                description: 'Test description',
                instructions: [
                    {
                        id: 'create-file',
                        type: 'file.write' as const,
                        description: 'Create a new file',
                        parameters: {
                            path: 'test.txt',
                            content: 'Hello World'
                        }
                    }
                ]
            });

            const result = mcpParser.parseFromString(content);

            assert.notStrictEqual(result, null);
            assert.strictEqual(result!.version, '1.0');
            assert.strictEqual(result!.name, 'Test MCP File');
            assert.strictEqual(result!.instructions.length, 1);
            assert.strictEqual(result!.instructions[0].id, 'create-file');
            assert.strictEqual(result!.instructions[0].type, 'file.write');
        });

        it('should handle empty content', () => {
            const result = mcpParser.parseFromString('');

            assert.strictEqual(result, null);
        });

        it('should handle malformed JSON', () => {
            const content = 'This is not valid JSON';

            const result = mcpParser.parseFromString(content);

            assert.strictEqual(result, null);
        });

        it('should handle invalid MCP structure', () => {
            const content = JSON.stringify({
                invalid: 'structure'
            });

            const result = mcpParser.parseFromString(content);

            assert.strictEqual(result, null);
        });
    });

    describe('Validation', () => {
        it('should validate valid MCP file', () => {
            const mcpFile = {
                version: '1.0',
                name: 'Test MCP',
                description: 'Test description',
                instructions: [
                    {
                        id: 'test-instruction',
                        type: 'project.create' as const,
                        description: 'Test instruction',
                        parameters: {
                            name: 'Test Project'
                        }
                    }
                ]
            };

            const result = mcpParser.validate(mcpFile);

            assert.strictEqual(result.valid, true);
            assert.strictEqual(result.errors.length, 0);
        });

        it('should detect missing required fields', () => {
            const mcpFile = {
                // Missing version and name
                instructions: []
            };

            const result = mcpParser.validate(mcpFile as any);

            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.errors.length >= 2, true);
            assert.strictEqual(result.errors.some(e => e.includes('version')), true);
            assert.strictEqual(result.errors.some(e => e.includes('name')), true);
        });

        it('should detect missing instructions', () => {
            const mcpFile = {
                version: '1.0',
                name: 'Test MCP'
                // Missing instructions
            };

            const result = mcpParser.validate(mcpFile as any);

            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.errors.some(e => e.includes('instructions')), true);
        });

        it('should detect duplicate instruction IDs', () => {
            const mcpFile = {
                version: '1.0',
                name: 'Test MCP',
                instructions: [
                    {
                        id: 'duplicate-id',
                        type: 'project.create' as const,
                        description: 'First instruction',
                        parameters: {}
                    },
                    {
                        id: 'duplicate-id',
                        type: 'task.create' as const,
                        description: 'Second instruction',
                        parameters: {}
                    }
                ]
            };

            const result = mcpParser.validate(mcpFile);

            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.errors.some(e => e.includes('Дублирующиеся ID')), true);
        });

        it('should warn about unsupported version', () => {
            const mcpFile = {
                version: '999.0',
                name: 'Test MCP',
                instructions: [
                    {
                        id: 'test',
                        type: 'project.create' as const,
                        description: 'Test',
                        parameters: {}
                    }
                ]
            };

            const result = mcpParser.validate(mcpFile);

            assert.strictEqual(result.warnings.length > 0, true);
            assert.strictEqual(result.warnings.some(w => w.includes('версия')), true);
        });
    });

    describe('Template Creation', () => {
        it('should create MCP from template', () => {
            const template = {
                id: 'test-template',
                name: 'Test Template',
                description: 'Test template description',
                category: 'project' as const,
                content: {
                    version: '1.0',
                    name: '{{projectName}}',
                    description: 'Template-based MCP',
                    variables: {
                        defaultVar: 'defaultValue'
                    },
                    instructions: [
                        {
                            id: 'create-project',
                            type: 'project.create' as const,
                            description: 'Create project {{projectName}}',
                            parameters: {
                                name: '{{projectName}}',
                                description: '{{projectDescription}}'
                            }
                        }
                    ]
                }
            };

            const variables = {
                projectName: 'My Test Project',
                projectDescription: 'A test project created from template'
            };

            const result = mcpParser.createFromTemplate(template, variables);

            assert.strictEqual(typeof result, 'string');
            assert.strictEqual(result.includes('My Test Project'), true);
            assert.strictEqual(result.includes('A test project created from template'), true);
        });

        it('should handle template without variables', () => {
            const template = {
                id: 'simple-template',
                name: 'Simple Template',
                description: 'Simple template',
                category: 'custom' as const,
                content: {
                    version: '1.0',
                    name: 'Simple MCP',
                    instructions: [
                        {
                            id: 'simple-instruction',
                            type: 'project.create' as const,
                            description: 'Simple instruction',
                            parameters: {
                                name: 'Simple Project'
                            }
                        }
                    ]
                }
            };

            const result = mcpParser.createFromTemplate(template);

            assert.strictEqual(typeof result, 'string');
            assert.strictEqual(result.includes('Simple MCP'), true);
        });
    });

    describe('Template Management', () => {
        it('should return predefined templates', () => {
            const templates = mcpParser.getTemplates();

            assert.strictEqual(Array.isArray(templates), true);
            assert.strictEqual(templates.length > 0, true);
            
            // Check template structure
            const template = templates[0];
            assert.strictEqual(typeof template.id, 'string');
            assert.strictEqual(typeof template.name, 'string');
            assert.strictEqual(typeof template.description, 'string');
            assert.strictEqual(typeof template.category, 'string');
            assert.strictEqual(typeof template.content, 'object');
        });

        it('should have valid template content', () => {
            const templates = mcpParser.getTemplates();
            
            templates.forEach(template => {
                assert.strictEqual(template.content.version, '1.0');
                assert.strictEqual(typeof template.content.name, 'string');
                assert.strictEqual(Array.isArray(template.content.instructions), true);
                assert.strictEqual(template.content.instructions.length > 0, true);
                
                // Validate each instruction
                template.content.instructions.forEach(instruction => {
                    assert.strictEqual(typeof instruction.id, 'string');
                    assert.strictEqual(typeof instruction.type, 'string');
                    assert.strictEqual(typeof instruction.description, 'string');
                    assert.strictEqual(typeof instruction.parameters, 'object');
                });
            });
        });
    });

    describe('Comments Handling', () => {
        it('should ignore comments in JSON', () => {
            const content = `{
                // This is a comment
                "version": "1.0",
                "name": "Test MCP",
                // Another comment
                "instructions": [
                    {
                        "id": "test",
                        "type": "project.create",
                        "description": "Test",
                        "parameters": {}
                    }
                ]
            }`;

            const result = mcpParser.parseFromString(content);

            assert.notStrictEqual(result, null);
            assert.strictEqual(result!.version, '1.0');
            assert.strictEqual(result!.name, 'Test MCP');
        });

        it('should handle multiple comment lines', () => {
            const content = `{
                // Comment 1
                // Comment 2
                // Comment 3
                "version": "1.0",
                "name": "Test MCP",
                "instructions": []
            }`;

            const result = mcpParser.parseFromString(content);

            assert.notStrictEqual(result, null);
            assert.strictEqual(result!.version, '1.0');
        });
    });

    describe('Error Handling', () => {
        it('should handle null input', () => {
            const result = mcpParser.parseFromString(null as any);

            assert.strictEqual(result, null);
        });

        it('should handle undefined input', () => {
            const result = mcpParser.parseFromString(undefined as any);

            assert.strictEqual(result, null);
        });

        it('should handle empty object', () => {
            const content = JSON.stringify({});

            const result = mcpParser.parseFromString(content);

            assert.strictEqual(result, null);
        });
    });

    describe('Complex MCP Files', () => {
        it('should parse complex MCP with multiple instructions', () => {
            const mcpFile = {
                version: '1.0',
                name: 'Complex MCP',
                description: 'Complex MCP with multiple instructions',
                variables: {
                    projectName: 'Complex Project',
                    taskCount: 5
                },
                instructions: [
                    {
                        id: 'create-project',
                        type: 'project.create' as const,
                        description: 'Create main project',
                        parameters: {
                            name: '{{projectName}}',
                            description: 'Complex project with multiple tasks'
                        }
                    },
                    {
                        id: 'create-tasks',
                        type: 'task.create' as const,
                        description: 'Create multiple tasks',
                        parameters: {
                            count: '{{taskCount}}',
                            template: {
                                type: 'feature',
                                priority: 'medium'
                            }
                        }
                    },
                    {
                        id: 'setup-plan',
                        type: 'plan.sync' as const,
                        description: 'Setup development plan',
                        parameters: {
                            auto_order: true,
                            include_dependencies: true
                        }
                    }
                ]
            };

            const content = JSON.stringify(mcpFile);
            const result = mcpParser.parseFromString(content);

            assert.notStrictEqual(result, null);
            assert.strictEqual(result!.instructions.length, 3);
            assert.strictEqual(result!.variables!.projectName, 'Complex Project');
            assert.strictEqual(result!.variables!.taskCount, 5);
        });
    });
}); 