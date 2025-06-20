import React, { useState, useEffect } from 'react';
import {
  Chip,
  Tooltip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Settings,
  Info
} from '@mui/icons-material';
import { discoverBackendServer, createServerMonitor } from '../utils/serverDiscovery';
import { getCurrentApiBaseURL, reinitializeAPI, checkApiHealth } from '../services/api';

interface ServerStatusProps {
  onServerChange?: (baseURL: string, discovered: boolean) => void;
}

interface ServerInfo {
  baseURL: string;
  port: number;
  discovered: boolean;
  method: 'config' | 'file' | 'scan' | 'default';
  isHealthy: boolean;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ onServerChange }) => {
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    baseURL: getCurrentApiBaseURL(),
    port: 8080,
    discovered: false,
    method: 'default',
    isHealthy: false
  });
  
  const [isChecking, setIsChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customURL, setCustomURL] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Проверка здоровья сервера
  const checkServerHealth = async () => {
    setIsChecking(true);
    try {
      const discovery = await discoverBackendServer();
      const isHealthy = await checkApiHealth();
      
      const newServerInfo: ServerInfo = {
        baseURL: discovery.baseURL,
        port: discovery.port,
        discovered: discovery.discovered,
        method: discovery.method,
        isHealthy
      };
      
      setServerInfo(newServerInfo);
      
      if (onServerChange) {
        onServerChange(discovery.baseURL, discovery.discovered && isHealthy);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Ошибка проверки сервера:', error);
      setServerInfo(prev => ({ ...prev, isHealthy: false }));
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Применение пользовательских настроек
  const handleApplyCustomURL = async () => {
    if (!customURL.trim()) return;
    
    setIsChecking(true);
    try {
      await reinitializeAPI(customURL.trim());
      await checkServerHealth();
      setShowSettings(false);
    } catch (error) {
      console.error('Ошибка применения настроек:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Получение цвета статуса
  const getStatusColor = (): 'success' | 'error' | 'warning' | 'default' => {
    if (isChecking) return 'default';
    if (serverInfo.isHealthy) return 'success';
    if (serverInfo.discovered) return 'warning';
    return 'error';
  };

  // Получение иконки статуса
  const getStatusIcon = () => {
    if (isChecking) return <CircularProgress size={16} />;
    if (serverInfo.isHealthy) return <CheckCircle />;
    if (serverInfo.discovered) return <Warning />;
    return <Error />;
  };

  // Получение текста статуса
  const getStatusText = (): string => {
    if (isChecking) return 'Проверка...';
    if (serverInfo.isHealthy) return `Подключен :${serverInfo.port}`;
    if (serverInfo.discovered) return `Найден :${serverInfo.port}`;
    return 'Недоступен';
  };

  // Получение описания метода обнаружения
  const getMethodDescription = (): string => {
    switch (serverInfo.method) {
      case 'config': return 'Из переменной окружения';
      case 'file': return 'Из файла server-info.json';
      case 'scan': return 'Автоматическое сканирование';
      case 'default': return 'Значение по умолчанию';
      default: return 'Неизвестно';
    }
  };

  // Эффект для начальной проверки и мониторинга
  useEffect(() => {
    checkServerHealth();
    
    // Настройка мониторинга сервера
    const stopMonitoring = createServerMonitor(async (discovery) => {
      const isHealthy = await checkApiHealth();
      
      const newServerInfo: ServerInfo = {
        baseURL: discovery.baseURL,
        port: discovery.port,
        discovered: discovery.discovered,
        method: discovery.method,
        isHealthy
      };
      
      setServerInfo(newServerInfo);
      
      if (onServerChange) {
        onServerChange(discovery.baseURL, discovery.discovered && isHealthy);
      }
    }, 15000); // Проверка каждые 15 секунд
    
    return stopMonitoring;
  }, [onServerChange]);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={`Backend: ${serverInfo.baseURL} (${getMethodDescription()})`}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant={serverInfo.isHealthy ? 'filled' : 'outlined'}
        />
      </Tooltip>
      
      <IconButton size="small" onClick={checkServerHealth} disabled={isChecking}>
        <Refresh />
      </IconButton>
      
      <IconButton size="small" onClick={() => setShowDetails(true)}>
        <Info />
      </IconButton>
      
      <IconButton size="small" onClick={() => setShowSettings(true)}>
        <Settings />
      </IconButton>

      {/* Диалог настроек */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Настройки Backend Сервера</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Введите URL backend сервера для подключения
            </Alert>
            
            <TextField
              fullWidth
              label="URL Backend Сервера"
              value={customURL}
              onChange={(e) => setCustomURL(e.target.value)}
              placeholder="http://localhost:8081"
              helperText="Пример: http://localhost:8081 или https://api.example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Отмена</Button>
          <Button 
            onClick={handleApplyCustomURL} 
            variant="contained"
            disabled={!customURL.trim() || isChecking}
          >
            {isChecking ? <CircularProgress size={20} /> : 'Применить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог деталей */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Статус Backend Сервера</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>URL:</strong> {serverInfo.baseURL}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Порт:</strong> {serverInfo.port}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Метод обнаружения:</strong> {getMethodDescription()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Статус:</strong> {serverInfo.isHealthy ? 'Доступен' : 'Недоступен'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Обнаружен:</strong> {serverInfo.discovered ? 'Да' : 'Нет'}
            </Typography>
            
            {!serverInfo.isHealthy && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Сервер недоступен. Проверьте, что backend запущен и доступен по указанному адресу.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Закрыть</Button>
          <Button onClick={checkServerHealth} variant="contained" disabled={isChecking}>
            {isChecking ? <CircularProgress size={20} /> : 'Обновить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerStatus; 