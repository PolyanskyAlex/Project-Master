import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountTree,
  Assignment,
  Task,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { checkApiHealth } from '../services/api';

interface DashboardStats {
  functionalBlocks: number;
  projects: number;
  tasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [stats] = useState<DashboardStats>({
    functionalBlocks: 0,
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Проверка здоровья API
        const healthy = await checkApiHealth();
        setApiHealthy(healthy);

        // TODO: Загрузка статистики из API
        // const [fbData, projectsData, tasksData] = await Promise.all([
        //   functionalBlockService.getAll(),
        //   projectService.getAll(),
        //   taskService.getAll(),
        // ]);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных дашборда');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return <LoadingSpinner message="Загрузка дашборда..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={handleRetry} />;
  }

  const statCards = [
    {
      title: 'Функциональные блоки',
      value: stats.functionalBlocks,
      icon: <AccountTree fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Проекты',
      value: stats.projects,
      icon: <Assignment fontSize="large" />,
      color: '#388e3c',
    },
    {
      title: 'Всего задач',
      value: stats.tasks,
      icon: <Task fontSize="large" />,
      color: '#f57c00',
    },
    {
      title: 'Выполнено задач',
      value: stats.completedTasks,
      icon: <CheckCircle fontSize="large" />,
      color: '#4caf50',
    },
  ];

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Дашборд
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Обзор системы управления проектами
        </Typography>
      </Box>

      {/* Статус API */}
      <Box sx={{ mb: 3 }}>
        {apiHealthy === true && (
          <Alert severity="success" sx={{ mb: 2 }}>
            API сервер работает нормально
          </Alert>
        )}
        {apiHealthy === false && (
          <Alert severity="error" sx={{ mb: 2 }}>
            API сервер недоступен. Проверьте подключение к бэкенду.
          </Alert>
        )}
      </Box>

      {/* Карточки статистики */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {statCards.map((card, index) => (
          <Box key={index} sx={{ flex: '1 1 250px', minWidth: '250px' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: card.color + '20',
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Статус задач */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Статус задач
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Chip
                icon={<Schedule />}
                label={`В работе: ${stats.inProgressTasks}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<CheckCircle />}
                label={`Выполнено: ${stats.completedTasks}`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Error />}
                label={`Ожидание: ${stats.pendingTasks}`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Быстрые действия
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Основные функции системы будут доступны после реализации соответствующих страниц.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                • Создание нового проекта
              </Typography>
              <Typography variant="body2">
                • Добавление задачи
              </Typography>
              <Typography variant="body2">
                • Просмотр плана разработки
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 