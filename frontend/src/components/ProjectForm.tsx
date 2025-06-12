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
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
} from '../types/api';
import { useFunctionalBlocks } from '../hooks/useFunctionalBlocks';

// Схема валидации
const schema = yup.object({
  name: yup
    .string()
    .required('Название обязательно')
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: yup
    .string()
    .required('Описание обязательно')
    .min(10, 'Описание должно содержать минимум 10 символов')
    .max(1000, 'Описание не должно превышать 1000 символов'),
  functionalBlockId: yup
    .string()
    .required('Функциональный блок обязателен'),
  status: yup
    .mixed<ProjectStatus>()
    .required('Статус обязателен')
    .oneOf(['Планирование', 'В разработке', 'Тестирование', 'Завершен', 'Приостановлен'], 'Неверный статус'),
});

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'Планирование', label: 'Планирование' },
  { value: 'В разработке', label: 'В разработке' },
  { value: 'Тестирование', label: 'Тестирование' },
  { value: 'Завершен', label: 'Завершен' },
  { value: 'Приостановлен', label: 'Приостановлен' },
];

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>;
  project?: Project | null;
  loading?: boolean;
  error?: string | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  project,
  loading = false,
  error = null,
}) => {
  const isEdit = !!project;
  const { functionalBlocks, loading: functionalBlocksLoading } = useFunctionalBlocks();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      functionalBlockId: '',
      status: 'Планирование' as ProjectStatus,
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description,
        functionalBlockId: project.functionalBlockId,
        status: project.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        functionalBlockId: '',
        status: 'Планирование' as ProjectStatus,
      });
    }
  }, [project, reset]);

  const handleFormSubmit = async (data: CreateProjectRequest) => {
    try {
      await onSubmit(data);
      handleClose();
    } catch (err) {
      // Ошибка обрабатывается в родительском компоненте
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Планирование': return '#2196f3';
      case 'В разработке': return '#4caf50';
      case 'Тестирование': return '#ff9800';
      case 'Завершен': return '#9c27b0';
      case 'Приостановлен': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Редактировать проект' : 'Создать проект'}
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
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Название проекта"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
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

            <Controller
              name="functionalBlockId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={functionalBlocks}
                  getOptionLabel={(option) => `${option.name} (${option.prefix})`}
                  value={functionalBlocks.find(fb => fb.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  loading={functionalBlocksLoading}
                  disabled={isSubmitting || loading || functionalBlocksLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Функциональный блок"
                      error={!!errors.functionalBlockId}
                      helperText={errors.functionalBlockId?.message}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    {...field}
                    label="Статус"
                    disabled={isSubmitting || loading}
                  >
                    {PROJECT_STATUSES.map((status) => (
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
                  {errors.status && (
                    <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                      {errors.status.message}
                    </Box>
                  )}
                </FormControl>
              )}
            />
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

export default ProjectForm; 