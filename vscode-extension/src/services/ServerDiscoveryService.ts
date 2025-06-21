import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { Logger } from '../utils/Logger';

interface ServerInfo {
    port: number;
    baseURL: string;
    status: string;
    startTime: string;
    pid: number;
}

interface ServerDiscoveryResult {
    baseURL: string;
    port: number;
    discovered: boolean;
    method: 'config' | 'file' | 'scan' | 'default';
}

export class ServerDiscoveryService {
    private logger: Logger;
    private workspaceRoot: string | undefined;

    constructor(logger: Logger) {
        this.logger = logger;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    /**
     * Обнаруживает активный backend сервер
     */
    async discoverBackendServer(): Promise<ServerDiscoveryResult> {
        this.logger.info('Starting backend server discovery...');

        // 1. Проверяем конфигурацию VS Code
        const configURL = vscode.workspace.getConfiguration('projectMaster').get<string>('apiUrl');
        if (configURL && configURL !== 'http://localhost:8080') {
            const isActive = await this.checkServerHealth(configURL);
            if (isActive) {
                this.logger.info(`Server discovered via configuration: ${configURL}`);
                return {
                    baseURL: configURL,
                    port: this.extractPortFromURL(configURL),
                    discovered: true,
                    method: 'config'
                };
            }
        }

        // 2. Проверяем файл server-info.json
        try {
            const serverInfo = await this.loadServerInfo();
            if (serverInfo) {
                const isActive = await this.checkServerHealth(serverInfo.baseURL);
                if (isActive) {
                    this.logger.info(`Server discovered via server-info.json: ${serverInfo.baseURL}`);
                    return {
                        baseURL: serverInfo.baseURL,
                        port: serverInfo.port,
                        discovered: true,
                        method: 'file'
                    };
                }
            }
        } catch (error) {
            this.logger.debug('server-info.json file not found or inaccessible', error);
        }

        // 3. Сканируем стандартные порты (расширенный диапазон)
        const commonPorts = [8080, 8083, 8081, 8082, 8084, 8085, 8086, 8087, 8088, 8089, 3001, 3002, 3003];
        this.logger.info(`Scanning ports: ${commonPorts.join(', ')}`);
        
        for (const port of commonPorts) {
            const baseURL = `http://localhost:${port}`;
            this.logger.debug(`Checking port ${port}...`);
            const isActive = await this.checkServerHealth(baseURL);
            if (isActive) {
                this.logger.info(`✅ Server discovered via port scanning: ${baseURL}`);
                return {
                    baseURL,
                    port,
                    discovered: true,
                    method: 'scan'
                };
            }
        }

        // 4. Возвращаем значение по умолчанию
        this.logger.warn('No active server found, using default configuration');
        return {
            baseURL: 'http://localhost:8080',
            port: 8080,
            discovered: false,
            method: 'default'
        };
    }

    /**
     * Загружает информацию о сервере из файла
     */
    private async loadServerInfo(): Promise<ServerInfo | null> {
        if (!this.workspaceRoot) {
            return null;
        }

        const serverInfoPath = path.join(this.workspaceRoot, 'frontend', 'public', 'server-info.json');
        
        try {
            if (!fs.existsSync(serverInfoPath)) {
                return null;
            }

            const fileContent = fs.readFileSync(serverInfoPath, 'utf8');
            const serverInfo: ServerInfo = JSON.parse(fileContent);
            
            this.logger.debug('Loaded server info from file', serverInfo);
            return serverInfo;
        } catch (error) {
            this.logger.error('Failed to load server info from file', error);
            return null;
        }
    }

    /**
     * Проверяет здоровье сервера
     */
    private async checkServerHealth(baseURL: string): Promise<boolean> {
        try {
            const response = await axios.get(`${baseURL}/health`, {
                timeout: 2000,
                validateStatus: (status) => status === 200
            });
            
            return response.status === 200;
        } catch (error) {
            this.logger.debug(`Server health check failed for ${baseURL}`, error);
            return false;
        }
    }

    /**
     * Извлекает порт из URL
     */
    private extractPortFromURL(url: string): number {
        try {
            const urlObj = new URL(url);
            return parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
        } catch (error) {
            return 8080;
        }
    }

    /**
     * Создает мониторинг сервера
     */
    createServerMonitor(
        onServerChange: (result: ServerDiscoveryResult) => void,
        intervalMs: number = 10000 // 10 секунд
    ): vscode.Disposable {
        let currentBaseURL = '';
        
        const checkServer = async () => {
            try {
                const result = await this.discoverBackendServer();
                
                if (result.baseURL !== currentBaseURL) {
                    currentBaseURL = result.baseURL;
                    this.logger.info(`Server changed to: ${result.baseURL} (method: ${result.method})`);
                    onServerChange(result);
                }
            } catch (error) {
                this.logger.error('Server monitoring error', error);
            }
        };
        
        // Первоначальная проверка
        checkServer();
        
        // Периодические проверки
        const interval = setInterval(checkServer, intervalMs);
        
        // Возвращаем Disposable для остановки мониторинга
        return new vscode.Disposable(() => {
            clearInterval(interval);
            this.logger.info('Server monitoring stopped');
        });
    }

    /**
     * Обновляет конфигурацию VS Code с обнаруженным URL сервера
     */
    async updateConfigurationWithDiscoveredServer(): Promise<void> {
        const result = await this.discoverBackendServer();
        
        if (result.discovered && result.method !== 'config') {
            const config = vscode.workspace.getConfiguration('projectMaster');
            await config.update('apiUrl', result.baseURL, vscode.ConfigurationTarget.Workspace);
            
            this.logger.info(`Updated configuration with discovered server: ${result.baseURL}`);
            
            vscode.window.showInformationMessage(
                `Project Master: Server discovered at ${result.baseURL}`,
                'OK'
            );
        }
    }
} 