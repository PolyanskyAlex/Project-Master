import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useOperationLogs } from '../hooks/useOperationLogs';
import { OperationType } from '../types/api';

interface OperationLogsSectionProps {
  taskId?: string;
  title?: string;
}

const OperationLogsSection: React.FC<OperationLogsSectionProps> = ({
  taskId,
  title = 'Логи операций',
}) => {
  const {
    logs,
    loading,
    error,
    refreshLogs,
  } = useOperationLogs(taskId);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
    } catch {
      return 'Неизвестно';
    }
  };

  const getOperationTypeColor = (type: OperationType) => {
    switch (type) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'COMMENT': return 'secondary';
      case 'STATUS_CHANGE': return 'warning';
      default: return 'default';
    }
  };

  const getOperationTypeLabel = (type: OperationType) => {
    switch (type) {
      case 'CREATE': return 'Создание';
      case 'UPDATE': return 'Обновление';
      case 'DELETE': return 'Удаление';
      case 'COMMENT': return 'Комментарий';
      case 'STATUS_CHANGE': return 'Смена статуса';
      default: return type;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6">
            {title}
          </Typography>
          {taskId && (
            <Typography variant="body2" color="text.secondary">
              для задачи
            </Typography>
          )}
        </Box>
        <Tooltip title="Обновить логи">
          <IconButton onClick={refreshLogs} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Логи операций не найдены
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата и время</TableCell>
                <TableCell>Тип операции</TableCell>
                <TableCell>Детали</TableCell>
                <TableCell>Выполнил</TableCell>
                {!taskId && <TableCell>ID задачи</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatDate(log.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getOperationTypeLabel(log.operationType)}
                      color={getOperationTypeColor(log.operationType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {log.operationDetails}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.performedBy}
                    </Typography>
                  </TableCell>
                  {!taskId && (
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.taskId}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {logs.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Всего записей: {logs.length}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OperationLogsSection; 