import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../types/api';
import { useProjects } from '../hooks/useProjects';
import { useFunctionalBlocks } from '../hooks/useFunctionalBlocks';

const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'Новая', label: 'Новая' },
  { value: 'В работе', label: 'В работе' },
  { value: 'Тестирование', label: 'Тестирование' },
  { value: 'Выполнена', label: 'Выполнена' },
  { value: 'Отменена', label: 'Отменена' },
];

const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'Низкий', label: 'Низкий' },
  { value: 'Средний', label: 'Средний' },
  { value: 'Высокий', label: 'Высокий' },
  { value: 'Критический', label: 'Критический' },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'Новый функционал', label: 'Новый функционал' },
  { value: 'Исправление ошибки', label: 'Исправление ошибки' },
  { value: 'Улучшение', label: 'Улучшение' },
  { value: 'Рефакторинг', label: 'Рефакторинг' },
  { value: 'Документация', label: 'Документация' },
];

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  task?: Task | null;
  loading?: boolean;
  error?: string | null;
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onClose,
  onSubmit,
  task,
  loading = false,
  error = null,
}) => {
  const isEdit = !!task;
  const { projects, loading: projectsLoading } = useProjects();
  // const { functionalBlocks, loading: functionalBlocksLoading } = useFunctionalBlocks();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskRequest>({
    defaultValues: {
      title: '',
      description: '',
      status: 'Новая' as TaskStatus,
      priority: 'Средний' as TaskPriority,
      type: 'Новый функционал' as TaskType,
      projectId: '',
      assignedTo: '',
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        type: task.type,
        projectId: task.projectId,
        assignedTo: task.assignedTo || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        status: 'Новая' as TaskStatus,
        priority: 'Средний' as TaskPriority,
        type: 'Новый функционал' as TaskType,
        projectId: '',
        assignedTo: '',
      });
    }
  }, [task, reset]);

  const handleFormSubmit = async (data: CreateTaskRequest) => {
    try {
      // Преобразуем данные для отправки
      const submitData = {
        ...data,
      };
      await onSubmit(submitData);
      handleClose();
    } catch (err) {
      // Ошибка обрабатывается в родительском компоненте
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Новая': return '#2196f3';
      case 'В работе': return '#ff9800';
      case 'Тестирование': return '#9c27b0';
      case 'Выполнена': return '#4caf50';
      case 'Отменена': return '#f44336';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Низкий': return '#4caf50';
      case 'Средний': return '#2196f3';
      case 'Высокий': return '#ff9800';
      case 'Критический': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Редактировать задачу' : 'Создать задачу'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Название обязательно' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Название задачи"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              rules={{ required: 'Описание обязательно' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Описание"
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="projectId"
                control={control}
                rules={{ required: 'Проект обязателен' }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={projects || []}
                    getOptionLabel={(option) => option.name}
                    value={(projects || []).find(p => p.id === field.value) || null}
                    onChange={(_, value) => field.onChange(value?.id || '')}
                    loading={projectsLoading}
                    disabled={isSubmitting || loading || projectsLoading}
                    sx={{ flex: 1 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Проект"
                        error={!!errors.projectId}
                        helperText={errors.projectId?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl sx={{ flex: 1 }} error={!!errors.status}>
                    <InputLabel>Статус</InputLabel>
                    <Select
                      {...field}
                      label="Статус"
                      disabled={isSubmitting || loading}
                    >
                      {TASK_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getStatusColor(status.value),
                              }}
                            />
                            {status.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl sx={{ flex: 1 }} error={!!errors.priority}>
                    <InputLabel>Приоритет</InputLabel>
                    <Select
                      {...field}
                      label="Приоритет"
                      disabled={isSubmitting || loading}
                    >
                      {TASK_PRIORITIES.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getPriorityColor(priority.value),
                              }}
                            />
                            {priority.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl sx={{ flex: 1 }} error={!!errors.type}>
                    <InputLabel>Тип</InputLabel>
                    <Select
                      {...field}
                      label="Тип"
                      disabled={isSubmitting || loading}
                    >
                      {TASK_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Исполнитель"
                    sx={{ flex: 2 }}
                    error={!!errors.assignedTo}
                    helperText={errors.assignedTo?.message}
                    disabled={isSubmitting || loading}
                  />
                )}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting || loading}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm; 