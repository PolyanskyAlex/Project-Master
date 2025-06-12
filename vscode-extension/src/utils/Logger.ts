import * as vscode from 'vscode';

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: 'debug' | 'info' | 'warn' | 'error';

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Project Master');
        this.logLevel = this.getLogLevel();
    }

    private getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
        const config = vscode.workspace.getConfiguration('projectMaster');
        return config.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info');
    }

    private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    private formatMessage(level: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }

    debug(message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            const formattedMessage = this.formatMessage('debug', message, data);
            this.outputChannel.appendLine(formattedMessage);
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            const formattedMessage = this.formatMessage('info', message, data);
            this.outputChannel.appendLine(formattedMessage);
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            const formattedMessage = this.formatMessage('warn', message, data);
            this.outputChannel.appendLine(formattedMessage);
            console.warn(formattedMessage);
        }
    }

    error(message: string, error?: any): void {
        if (this.shouldLog('error')) {
            let errorData = error;
            if (error instanceof Error) {
                errorData = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                };
            }
            
            const formattedMessage = this.formatMessage('error', message, errorData);
            this.outputChannel.appendLine(formattedMessage);
            console.error(formattedMessage);
        }
    }

    show(): void {
        this.outputChannel.show();
    }

    dispose(): void {
        this.outputChannel.dispose();
    }

    updateLogLevel(): void {
        this.logLevel = this.getLogLevel();
        this.info(`Log level updated to: ${this.logLevel}`);
    }
} 