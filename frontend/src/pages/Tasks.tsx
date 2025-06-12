import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useTasks } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import TaskTable from '../components/TaskTable';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
  TaskType,
  FilterParams,
} from '../types/api';

const Tasks: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterParams>({});
  
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    filterTasks,
  } = useTasks(filters);

  const handleCreateClick = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data as UpdateTaskRequest);
      } else {
        await createTask(data as CreateTaskRequest);
      }
    } catch (err) {
      // Ошибка обрабатывается в хуке
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    filterTasks(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    filterTasks(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Задачи
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshTasks}
            disabled={loading}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            disabled={loading}
          >
            Создать задачу
          </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">Фильтры</Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip
              label={`Активно: ${getActiveFiltersCount()}`}
              size="small"
              color="primary"
              onDelete={clearFilters}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filters.status || ''}
              label="Статус"
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value || undefined })}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="Новая">Новая</MenuItem>
              <MenuItem value="В работе">В работе</MenuItem>
              <MenuItem value="Тестирование">Тестирование</MenuItem>
              <MenuItem value="Выполнена">Выполнена</MenuItem>
              <MenuItem value="Отменена">Отменена</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={filters.priority || ''}
              label="Приоритет"
              onChange={(e) => handleFilterChange({ ...filters, priority: e.target.value || undefined })}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="Низкий">Низкий</MenuItem>
              <MenuItem value="Средний">Средний</MenuItem>
              <MenuItem value="Высокий">Высокий</MenuItem>
              <MenuItem value="Критический">Критический</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Тип</InputLabel>
            <Select
              value={filters.type || ''}
              label="Тип"
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value || undefined })}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="Новый функционал">Новый функционал</MenuItem>
              <MenuItem value="Исправление ошибки">Исправление ошибки</MenuItem>
              <MenuItem value="Улучшение">Улучшение</MenuItem>
              <MenuItem value="Рефакторинг">Рефакторинг</MenuItem>
              <MenuItem value="Документация">Документация</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Проект ID"
            value={filters.projectId || ''}
            onChange={(e) => handleFilterChange({ ...filters, projectId: e.target.value || undefined })}
            sx={{ minWidth: 150 }}
          />

          <TextField
            size="small"
            label="Функц. блок ID"
            value={filters.functionalBlockId || ''}
            onChange={(e) => handleFilterChange({ ...filters, functionalBlockId: e.target.value || undefined })}
            sx={{ minWidth: 150 }}
          />
        </Box>
      </Paper>

      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Загрузка */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Статистика */}
      {!loading && tasks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Статистика: найдено задач - {tasks.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Статистика по статусам */}
            {['Новая', 'В работе', 'Тестирование', 'Выполнена', 'Отменена'].map(status => {
              const count = tasks.filter(task => task.status === status).length;
              if (count === 0) return null;
              return (
                <Chip
                  key={status}
                  label={`${status}: ${count}`}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Таблица задач */}
      {!loading && (
        <TaskTable
          tasks={tasks}
          onEdit={handleEditClick}
          onDelete={handleDeleteTask}
          loading={loading}
        />
      )}

      {/* Форма создания/редактирования */}
      <TaskForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        task={editingTask}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default Tasks; 