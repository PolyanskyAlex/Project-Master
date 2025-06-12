import React, { useState, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { logger, LogLevel, LogEntry } from '../utils/logger';

const DevLogViewer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const refreshLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  const clearLogs = () => {
    logger.clearLogs();
    refreshLogs();
  };

  const exportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Обновляем логи при открытии диалога
  useEffect(() => {
    if (open) {
      refreshLogs();
      // Обновляем каждые 2 секунды
      const interval = setInterval(refreshLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [open]);

  // Фильтруем логи
  useEffect(() => {
    let filtered = logs;

    // Фильтр по уровню
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Фильтр по источнику
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    // Поиск по сообщению
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, sourceFilter, searchTerm]);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'default';
      case LogLevel.INFO:
        return 'primary';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  const getUniqueSources = () => {
    const sources = new Set(logs.map(log => log.source).filter(Boolean));
    return Array.from(sources);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatLogData = (data: any) => {
    if (!data) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Показываем только в development режиме
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="logs"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setOpen(true)}
      >
        <BugReportIcon />
      </Fab>

      {/* Log Viewer Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Логи разработки ({filteredLogs.length} из {logs.length})
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Фильтры */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Поиск"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Уровень</InputLabel>
              <Select
                value={levelFilter}
                label="Уровень"
                onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value={LogLevel.DEBUG}>DEBUG</MenuItem>
                <MenuItem value={LogLevel.INFO}>INFO</MenuItem>
                <MenuItem value={LogLevel.WARN}>WARN</MenuItem>
                <MenuItem value={LogLevel.ERROR}>ERROR</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Источник</InputLabel>
              <Select
                value={sourceFilter}
                label="Источник"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="all">Все</MenuItem>
                {getUniqueSources().map(source => (
                  <MenuItem key={source} value={source}>{source}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Обновить">
              <IconButton onClick={refreshLogs}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Очистить">
              <IconButton onClick={clearLogs}>
                <ClearIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Экспорт">
              <IconButton onClick={exportLogs}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Список логов */}
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Логи не найдены"
                  secondary="Попробуйте изменить фильтры или выполнить действия в приложении"
                />
              </ListItem>
            ) : (
              filteredLogs.map((log, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    mb: 1,
                    borderRadius: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                    <Chip
                      label={getLevelName(log.level)}
                      color={getLevelColor(log.level)}
                      size="small"
                    />
                    {log.source && (
                      <Chip
                        label={log.source}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {log.message}
                  </Typography>
                  
                  {log.data && (
                    <Box
                      sx={{
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        width: '100%',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                      >
                        {formatLogData(log.data)}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DevLogViewer; 