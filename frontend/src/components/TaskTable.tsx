import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task, TaskStatus, TaskPriority, TaskType } from '../types/api';
import CommentsSection from './CommentsSection';
import OperationLogsSection from './OperationLogsSection';

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [taskToView, setTaskToView] = useState<Task | null>(null);

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      onDelete(taskToDelete.id);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleViewClick = (task: Task) => {
    setTaskToView(task);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setTaskToView(null);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Новая': return 'primary';
      case 'В работе': return 'warning';
      case 'Тестирование': return 'secondary';
      case 'Выполнена': return 'success';
      case 'Отменена': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Низкий': return 'success';
      case 'Средний': return 'primary';
      case 'Высокий': return 'warning';
      case 'Критический': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: TaskType) => {
    switch (type) {
      case 'Новый функционал': return 'primary';
      case 'Исправление ошибки': return 'error';
      case 'Улучшение': return 'info';
      case 'Рефакторинг': return 'warning';
      case 'Документация': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru });
    } catch {
      return 'Не указано';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Задачи не найдены
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Создайте первую задачу, нажав кнопку "Создать задачу"
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Номер</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Проект</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Приоритет</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Исполнитель</TableCell>
              <TableCell>Срок</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tasks || []).map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {task.number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {task.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {task.projectId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.type}
                    color={getTypeColor(task.type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {task.assignedTo || 'Не назначен'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {task.dueDate ? formatDate(task.dueDate) : 'Не указан'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Просмотр">
                      <IconButton
                        size="small"
                        onClick={() => handleViewClick(task)}
                        disabled={loading}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(task)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(task)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить задачу "{taskToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра задачи */}
      <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="lg" fullWidth>
        <DialogTitle>Просмотр задачи</DialogTitle>
        <DialogContent>
          {taskToView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Основная информация о задаче */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Основная информация
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Номер задачи
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {taskToView.number}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Название
                    </Typography>
                    <Typography variant="body1">
                      {taskToView.title}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Описание
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {taskToView.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Проект
                      </Typography>
                      <Typography variant="body1">
                        {taskToView.projectId}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Статус
                      </Typography>
                      <Chip
                        label={taskToView.status}
                        color={getStatusColor(taskToView.status)}
                        size="small"
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Приоритет
                      </Typography>
                      <Chip
                        label={taskToView.priority}
                        color={getPriorityColor(taskToView.priority)}
                        size="small"
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Тип
                      </Typography>
                      <Chip
                        label={taskToView.type}
                        color={getTypeColor(taskToView.type)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Исполнитель
                      </Typography>
                      <Typography variant="body1">
                        {taskToView.assignedTo || 'Не назначен'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Создано
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(taskToView.createdAt)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Обновлено
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(taskToView.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Комментарии */}
              <CommentsSection 
                taskId={taskToView.id} 
                taskTitle={taskToView.title}
              />

              {/* Логи операций */}
              <OperationLogsSection 
                taskId={taskToView.id}
                title="История операций"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Закрыть</Button>
          <Button
            onClick={() => {
              if (taskToView) {
                onEdit(taskToView);
                handleViewClose();
              }
            }}
            variant="contained"
          >
            Редактировать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskTable; 