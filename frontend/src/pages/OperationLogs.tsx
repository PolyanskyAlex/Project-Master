import React from 'react';
import { Box, Typography } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import OperationLogsSection from '../components/OperationLogsSection';

const OperationLogs: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <HistoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Логи операций
        </Typography>
        <Typography variant="body1" color="text.secondary">
          История всех операций в системе
        </Typography>
      </Box>

      {/* Компонент логов */}
      <OperationLogsSection title="Все операции в системе" />
    </Box>
  );
};

export default OperationLogs; 