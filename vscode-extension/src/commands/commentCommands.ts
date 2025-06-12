import * as vscode from 'vscode';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { TasksProvider } from '../providers/TasksProvider';
import { Task, Comment } from '../types';

export class CommentCommands {
    constructor(
        private apiService: IApiService,
        private logger: Logger,
        private tasksProvider: TasksProvider
    ) {}

    registerCommands(context: vscode.ExtensionContext): void {
        // Add comment command
        const addCommentCommand = vscode.commands.registerCommand(
            'projectMaster.comments.add',
            (task: Task) => this.addComment(task)
        );

        // View comments command
        const viewCommentsCommand = vscode.commands.registerCommand(
            'projectMaster.comments.view',
            (task: Task) => this.viewComments(task)
        );

        // Edit comment command
        const editCommentCommand = vscode.commands.registerCommand(
            'projectMaster.comments.edit',
            (comment: Comment) => this.editComment(comment)
        );

        // Delete comment command
        const deleteCommentCommand = vscode.commands.registerCommand(
            'projectMaster.comments.delete',
            (comment: Comment) => this.deleteComment(comment)
        );

        // Reply to comment command
        const replyCommentCommand = vscode.commands.registerCommand(
            'projectMaster.comments.reply',
            (comment: Comment) => this.replyToComment(comment)
        );

        // Quick comment command
        const quickCommentCommand = vscode.commands.registerCommand(
            'projectMaster.comments.quick',
            (task: Task) => this.quickComment(task)
        );

        context.subscriptions.push(
            addCommentCommand,
            viewCommentsCommand,
            editCommentCommand,
            deleteCommentCommand,
            replyCommentCommand,
            quickCommentCommand
        );

        this.logger.info('Comment commands registered successfully');
    }

    private async addComment(task: Task): Promise<void> {
        try {
            this.logger.info(`Adding comment to task: ${task.title}`);
            
            // Comment type selection
            const commentTypes = await vscode.window.showQuickPick([
                {
                    label: '$(comment) General Comment',
                    description: 'Add a general comment or note',
                    value: 'general'
                },
                {
                    label: '$(info) Status Update',
                    description: 'Provide a status update',
                    value: 'status_update'
                },
                {
                    label: '$(question) Question',
                    description: 'Ask a question about the task',
                    value: 'question'
                },
                {
                    label: '$(bug) Issue Report',
                    description: 'Report an issue or problem',
                    value: 'issue'
                },
                {
                    label: '$(lightbulb) Suggestion',
                    description: 'Provide a suggestion or idea',
                    value: 'suggestion'
                }
            ], {
                placeHolder: 'What type of comment would you like to add?'
            });

            if (!commentTypes) return;

            // Comment content input
            const content = await vscode.window.showInputBox({
                prompt: 'Enter your comment',
                placeHolder: 'Type your comment here...',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Comment content is required';
                    }
                    if (value.length > 2000) {
                        return 'Comment must be less than 2000 characters';
                    }
                    return null;
                }
            });

            if (!content) return;

            // Author input (optional, could be from settings)
            const author = await vscode.window.showInputBox({
                prompt: 'Enter your name (optional)',
                placeHolder: 'Your name or email',
                value: vscode.workspace.getConfiguration('projectMaster').get('defaultAuthor', ''),
                validateInput: (value) => {
                    if (value && value.length > 100) {
                        return 'Author name must be less than 100 characters';
                    }
                    return null;
                }
            });

            // Priority for certain comment types
            let priority: 'low' | 'medium' | 'high' | undefined;
            if (commentTypes.value === 'issue' || commentTypes.value === 'question') {
                const priorityOptions = await vscode.window.showQuickPick([
                    { label: '$(arrow-down) Low', value: 'low', description: 'Low priority' },
                    { label: '$(dash) Medium', value: 'medium', description: 'Medium priority' },
                    { label: '$(arrow-up) High', value: 'high', description: 'High priority' }
                ], {
                    placeHolder: 'Select comment priority'
                });

                if (priorityOptions) {
                    priority = priorityOptions.value as 'low' | 'medium' | 'high';
                }
            }

            // Create comment
            const newComment: Omit<Comment, 'id' | 'created_at' | 'updated_at'> = {
                task_id: task.id,
                content: content.trim(),
                author: author?.trim() || 'Anonymous',
                type: commentTypes.value as Comment['type'],
                priority: priority
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Adding comment...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Creating comment...' });
                
                const createdComment = await this.apiService.createComment(newComment);
                
                progress.report({ increment: 70, message: 'Refreshing task data...' });
                
                // Refresh tasks to update comment count
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Comment added successfully!' });
                
                vscode.window.showInformationMessage(
                    `Comment added to task "${task.title}"!`,
                    'View Comments',
                    'Add Another'
                ).then(selection => {
                    if (selection === 'View Comments') {
                        this.viewComments(task);
                    } else if (selection === 'Add Another') {
                        this.addComment(task);
                    }
                });
            });

        } catch (error) {
            this.logger.error('Failed to add comment', error);
            vscode.window.showErrorMessage('Failed to add comment. Please try again.');
        }
    }

    private async viewComments(task: Task): Promise<void> {
        try {
            this.logger.info(`Viewing comments for task: ${task.title}`);
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Loading comments...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Fetching comments...' });
                
                // Get comments for the task
                const comments = await this.apiService.getTaskComments(task.id);
                
                progress.report({ increment: 70, message: 'Formatting comments...' });
                
                // Create comments document
                const commentsContent = this.formatCommentsDocument(task, comments);
                
                progress.report({ increment: 90, message: 'Opening comments view...' });
                
                // Create and show document
                const doc = await vscode.workspace.openTextDocument({
                    content: commentsContent,
                    language: 'markdown'
                });

                await vscode.window.showTextDocument(doc, {
                    preview: true,
                    viewColumn: vscode.ViewColumn.Beside
                });
                
                progress.report({ increment: 100, message: 'Comments loaded!' });
            });

        } catch (error) {
            this.logger.error('Failed to view comments', error);
            vscode.window.showErrorMessage('Failed to load comments. Please try again.');
        }
    }

    private async editComment(comment: Comment): Promise<void> {
        try {
            this.logger.info(`Editing comment: ${comment.id}`);
            
            // Edit content
            const newContent = await vscode.window.showInputBox({
                prompt: 'Edit comment content',
                value: comment.content,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Comment content is required';
                    }
                    if (value.length > 2000) {
                        return 'Comment must be less than 2000 characters';
                    }
                    return null;
                }
            });

            if (!newContent) return;

            // Update comment type if needed
            const updateType = await vscode.window.showQuickPick([
                { label: 'Keep current type', value: 'keep', description: `Current: ${comment.type}` },
                { label: '$(comment) General Comment', value: 'general' },
                { label: '$(info) Status Update', value: 'status_update' },
                { label: '$(question) Question', value: 'question' },
                { label: '$(bug) Issue Report', value: 'issue' },
                { label: '$(lightbulb) Suggestion', value: 'suggestion' }
            ], {
                placeHolder: 'Update comment type?'
            });

            if (!updateType) return;

            const updatedComment: Partial<Comment> = {
                content: newContent.trim(),
                type: updateType.value === 'keep' ? comment.type : updateType.value as Comment['type']
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating comment...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Updating comment...' });
                
                await this.apiService.updateComment(comment.id, updatedComment);
                
                progress.report({ increment: 70, message: 'Refreshing data...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Comment updated successfully!' });
                
                vscode.window.showInformationMessage('Comment updated successfully!');
            });

        } catch (error) {
            this.logger.error('Failed to edit comment', error);
            vscode.window.showErrorMessage('Failed to update comment. Please try again.');
        }
    }

    private async deleteComment(comment: Comment): Promise<void> {
        try {
            this.logger.info(`Deleting comment: ${comment.id}`);
            
            // Confirmation dialog
            const confirmation = await vscode.window.showWarningMessage(
                'Are you sure you want to delete this comment?',
                {
                    modal: true,
                    detail: 'This action cannot be undone.'
                },
                'Delete Comment',
                'Cancel'
            );

            if (confirmation !== 'Delete Comment') return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting comment...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Deleting comment...' });
                
                await this.apiService.deleteComment(comment.id);
                
                progress.report({ increment: 70, message: 'Refreshing data...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Comment deleted successfully!' });
                
                vscode.window.showInformationMessage('Comment deleted successfully.');
            });

        } catch (error) {
            this.logger.error('Failed to delete comment', error);
            vscode.window.showErrorMessage('Failed to delete comment. Please try again.');
        }
    }

    private async replyToComment(parentComment: Comment): Promise<void> {
        try {
            this.logger.info(`Replying to comment: ${parentComment.id}`);
            
            // Reply content input
            const content = await vscode.window.showInputBox({
                prompt: `Reply to ${parentComment.author}`,
                placeHolder: 'Type your reply here...',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Reply content is required';
                    }
                    if (value.length > 2000) {
                        return 'Reply must be less than 2000 characters';
                    }
                    return null;
                }
            });

            if (!content) return;

            // Author input
            const author = await vscode.window.showInputBox({
                prompt: 'Enter your name (optional)',
                placeHolder: 'Your name or email',
                value: vscode.workspace.getConfiguration('projectMaster').get('defaultAuthor', ''),
                validateInput: (value) => {
                    if (value && value.length > 100) {
                        return 'Author name must be less than 100 characters';
                    }
                    return null;
                }
            });

            // Create reply comment
            const replyComment: Omit<Comment, 'id' | 'created_at' | 'updated_at'> = {
                task_id: parentComment.task_id,
                content: content.trim(),
                author: author?.trim() || 'Anonymous',
                type: 'reply',
                parent_id: parentComment.id
            };

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Adding reply...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Creating reply...' });
                
                await this.apiService.createComment(replyComment);
                
                progress.report({ increment: 70, message: 'Refreshing data...' });
                
                this.tasksProvider.refresh();
                
                progress.report({ increment: 100, message: 'Reply added successfully!' });
                
                vscode.window.showInformationMessage('Reply added successfully!');
            });

        } catch (error) {
            this.logger.error('Failed to reply to comment', error);
            vscode.window.showErrorMessage('Failed to add reply. Please try again.');
        }
    }

    private async quickComment(task: Task): Promise<void> {
        try {
            this.logger.info(`Adding quick comment to task: ${task.title}`);
            
            // Quick comment templates
            const quickComments = await vscode.window.showQuickPick([
                {
                    label: '$(check) Work completed',
                    description: 'Mark work as completed',
                    content: 'Work on this task has been completed.',
                    type: 'status_update'
                },
                {
                    label: '$(sync) Work in progress',
                    description: 'Currently working on this',
                    content: 'Started working on this task.',
                    type: 'status_update'
                },
                {
                    label: '$(clock) Need more time',
                    description: 'Task needs more time',
                    content: 'This task will require additional time to complete.',
                    type: 'status_update'
                },
                {
                    label: '$(question) Need clarification',
                    description: 'Need more information',
                    content: 'Need clarification on the requirements for this task.',
                    type: 'question'
                },
                {
                    label: '$(bug) Found issue',
                    description: 'Report an issue',
                    content: 'Encountered an issue while working on this task.',
                    type: 'issue'
                },
                {
                    label: '$(pencil) Custom comment',
                    description: 'Write a custom comment',
                    content: '',
                    type: 'general'
                }
            ], {
                placeHolder: 'Select a quick comment or write custom'
            });

            if (!quickComments) return;

            let content = quickComments.content;
            
            // If custom comment, get content from user
            if (quickComments.content === '') {
                const customContent = await vscode.window.showInputBox({
                    prompt: 'Enter your comment',
                    placeHolder: 'Type your comment here...',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Comment content is required';
                        }
                        if (value.length > 2000) {
                            return 'Comment must be less than 2000 characters';
                        }
                        return null;
                    }
                });

                if (!customContent) return;
                content = customContent.trim();
            }

            // Get author from settings or prompt
            const defaultAuthor = vscode.workspace.getConfiguration('projectMaster').get('defaultAuthor', '');
            let author: string;
            
            if (defaultAuthor) {
                author = defaultAuthor;
            } else {
                const authorInput = await vscode.window.showInputBox({
                    prompt: 'Enter your name',
                    placeHolder: 'Your name or email',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Author name is required for quick comments';
                        }
                        return null;
                    }
                });
                
                if (!authorInput) return;
                author = authorInput;
            }

            // Create comment
            const newComment: Omit<Comment, 'id' | 'created_at' | 'updated_at'> = {
                task_id: task.id,
                content: content,
                author: author.trim(),
                type: quickComments.type as Comment['type']
            };

            await this.apiService.createComment(newComment);
            this.tasksProvider.refresh();
            
            vscode.window.showInformationMessage(
                `Quick comment added to task "${task.title}"!`,
                'View Comments'
            ).then(selection => {
                if (selection === 'View Comments') {
                    this.viewComments(task);
                }
            });

        } catch (error) {
            this.logger.error('Failed to add quick comment', error);
            vscode.window.showErrorMessage('Failed to add quick comment. Please try again.');
        }
    }

    private formatCommentsDocument(task: Task, comments: Comment[]): string {
        const sortedComments = comments.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const formatComment = (comment: Comment, level: number = 0): string => {
            const indent = '  '.repeat(level);
            const typeIcon = this.getCommentTypeIcon(comment.type);
            const priorityText = comment.priority ? ` (${comment.priority} priority)` : '';
            
            let formatted = `${indent}### ${typeIcon} ${comment.author}${priorityText}
${indent}*${new Date(comment.created_at).toLocaleString()}*

${indent}${comment.content}

${indent}---

`;

            // Add replies
            const replies = comments.filter(c => c.parent_id === comment.id);
            if (replies.length > 0) {
                formatted += replies.map(reply => formatComment(reply, level + 1)).join('');
            }

            return formatted;
        };

        const topLevelComments = sortedComments.filter(c => !c.parent_id);

        return `# Comments for: ${task.title}

**Task Status:** ${task.status}
**Total Comments:** ${comments.length}
**Last Updated:** ${new Date().toLocaleString()}

## Comments

${topLevelComments.length > 0 
    ? topLevelComments.map(comment => formatComment(comment)).join('')
    : 'No comments yet.'
}

## Quick Actions
- [Add Comment](command:projectMaster.comments.add?${encodeURIComponent(JSON.stringify([task]))}) to this task
- [Quick Comment](command:projectMaster.comments.quick?${encodeURIComponent(JSON.stringify([task]))}) with template
- [View Task Details](command:projectMaster.tasks.viewDetails?${encodeURIComponent(JSON.stringify([task]))}) 
- [Open Web UI](command:projectMaster.openWebUI) to manage comments

---
*This is a read-only view. Use commands above to add or modify comments.*`;
    }

    private getCommentTypeIcon(type: string): string {
        switch (type) {
            case 'general': return '💬';
            case 'status_update': return 'ℹ️';
            case 'question': return '❓';
            case 'issue': return '🐛';
            case 'suggestion': return '💡';
            case 'reply': return '↳';
            default: return '💬';
        }
    }
} 