import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { TaskStatus, TaskPriority, TaskType } from '../types/api';
import { useTasks } from '../hooks/useTasks';

interface AddTasksToPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onAddTasks: (taskIds: string[]) => Promise<void>;
  projectId: string;
  existingTaskIds: string[];
  loading?: boolean;
}

export const AddTasksToPlanDialog: React.FC<AddTasksToPlanDialogProps> = ({
  open,
  onClose,
  onAddTasks,
  projectId,
  existingTaskIds,
  loading = false
}) => {
  const { tasks, filterTasks } = useTasks();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('');

  useEffect(() => {
    if (open && projectId) {
      filterTasks({ projectId });
      setSelectedTaskIds([]);
      setSearchTerm('');
      setStatusFilter('');
      setPriorityFilter('');
      setTypeFilter('');
    }
  }, [open, projectId, filterTasks]);

  const availableTasks = tasks.filter(task => 
    task.projectId === projectId && !existingTaskIds.includes(task.id)
  );

  const filteredTasks = availableTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesType = !typeFilter || task.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(task => task.id));
    }
  };

  const handleAddTasks = async () => {
    if (selectedTaskIds.length > 0) {
      try {
        await onAddTasks(selectedTaskIds);
        onClose();
      } catch (error) {
        // Ошибка обрабатывается в родительском компоненте
      }
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      'Новая': 'default',
      'В работе': 'primary',
      'Тестирование': 'warning',
      'Выполнена': 'success',
      'Отменена': 'error'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      'Низкий': 'success',
      'Средний': 'primary',
      'Высокий': 'warning',
      'Критический': 'error'
    };
    return colors[priority];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Добавить задачи в план разработки
      </DialogTitle>
      
      <DialogContent>
        {availableTasks.length === 0 ? (
          <Alert severity="info">
            Все задачи проекта уже добавлены в план разработки
          </Alert>
        ) : (
          <>
            {/* Фильтры */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Поиск"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusFilter}
                  label="Статус"
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
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
                  value={priorityFilter}
                  label="Приоритет"
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
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
                  value={typeFilter}
                  label="Тип"
                  onChange={(e) => setTypeFilter(e.target.value as TaskType | '')}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="Новый функционал">Новый функционал</MenuItem>
                  <MenuItem value="Исправление ошибки">Исправление ошибки</MenuItem>
                  <MenuItem value="Улучшение">Улучшение</MenuItem>
                  <MenuItem value="Рефакторинг">Рефакторинг</MenuItem>
                  <MenuItem value="Документация">Документация</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Статистика и действия */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Найдено задач: {filteredTasks.length} | Выбрано: {selectedTaskIds.length}
              </Typography>
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={filteredTasks.length === 0}
              >
                {selectedTaskIds.length === filteredTasks.length ? 'Снять выделение' : 'Выбрать все'}
              </Button>
            </Box>

            {/* Список задач */}
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredTasks.map((task) => (
                <ListItem
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    mb: 1, 
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleToggleTask(task.id)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold">
                          {task.number}
                        </Typography>
                        <Typography variant="subtitle1">
                          {task.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.description.length > 100 
                            ? task.description.substring(0, 100) + '...'
                            : task.description
                          }
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={task.type}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {filteredTasks.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Задачи не найдены
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleAddTasks}
          variant="contained"
          disabled={loading || selectedTaskIds.length === 0}
        >
          {loading ? 'Добавление...' : `Добавить (${selectedTaskIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 