import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: 'debug' | 'info' | 'warn' | 'error';
    private logFilePath: string | null = null;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Project Master');
        this.logLevel = this.getLogLevel();
        this.initializeFileLogging();
    }

    private initializeFileLogging(): void {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                const logsDir = path.join(workspaceRoot, 'logs', 'vscode-extension');
                
                // Создаем директорию для логов если её нет
                if (!fs.existsSync(logsDir)) {
                    fs.mkdirSync(logsDir, { recursive: true });
                }
                
                const today = new Date().toISOString().split('T')[0];
                this.logFilePath = path.join(logsDir, `extension-${today}.log`);
                
                this.info('File logging initialized', { logFile: this.logFilePath });
            }
        } catch (error) {
            console.error('Failed to initialize file logging:', error);
        }
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

    private formatJSONMessage(level: string, message: string, data?: any): string {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            source: 'vscode-extension',
            ...(data && { data })
        };
        
        return JSON.stringify(logEntry);
    }

    private writeToFile(level: string, message: string, data?: any): void {
        if (!this.logFilePath) return;
        
        try {
            const jsonMessage = this.formatJSONMessage(level, message, data);
            fs.appendFileSync(this.logFilePath, jsonMessage + '\n', 'utf8');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    debug(message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            const formattedMessage = this.formatMessage('debug', message, data);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile('debug', message, data);
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            const formattedMessage = this.formatMessage('info', message, data);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile('info', message, data);
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            const formattedMessage = this.formatMessage('warn', message, data);
            this.outputChannel.appendLine(formattedMessage);
            console.warn(formattedMessage);
            this.writeToFile('warn', message, data);
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
            this.writeToFile('error', message, errorData);
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

    getLogFilePath(): string | null {
        return this.logFilePath;
    }
} 