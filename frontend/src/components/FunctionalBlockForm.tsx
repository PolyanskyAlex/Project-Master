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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  FunctionalBlock,
  CreateFunctionalBlockRequest,
  UpdateFunctionalBlockRequest,
} from '../types/api';

// Схема валидации
const schema = yup.object({
  name: yup
    .string()
    .required('Название обязательно')
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  prefix: yup
    .string()
    .required('Префикс обязателен')
    .min(2, 'Префикс должен содержать минимум 2 символа')
    .max(10, 'Префикс не должен превышать 10 символов')
    .matches(/^[A-Z]+$/, 'Префикс должен содержать только заглавные латинские буквы'),
  description: yup
    .string()
    .required('Описание обязательно')
    .min(10, 'Описание должно содержать минимум 10 символов')
    .max(500, 'Описание не должно превышать 500 символов'),
});

interface FunctionalBlockFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFunctionalBlockRequest | UpdateFunctionalBlockRequest) => Promise<void>;
  functionalBlock?: FunctionalBlock | null;
  loading?: boolean;
  error?: string | null;
}

const FunctionalBlockForm: React.FC<FunctionalBlockFormProps> = ({
  open,
  onClose,
  onSubmit,
  functionalBlock,
  loading = false,
  error = null,
}) => {
  const isEdit = !!functionalBlock;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFunctionalBlockRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      prefix: '',
      description: '',
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (functionalBlock) {
      reset({
        name: functionalBlock.name,
        prefix: functionalBlock.prefix,
        description: functionalBlock.description,
      });
    } else {
      reset({
        name: '',
        prefix: '',
        description: '',
      });
    }
  }, [functionalBlock, reset]);

  const handleFormSubmit = async (data: CreateFunctionalBlockRequest) => {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Редактировать функциональный блок' : 'Создать функциональный блок'}
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
                  label="Название"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            <Controller
              name="prefix"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Префикс"
                  fullWidth
                  error={!!errors.prefix}
                  helperText={errors.prefix?.message || 'Используется для генерации номеров задач (например: UI, API, DB)'}
                  disabled={isSubmitting || loading}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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

export default FunctionalBlockForm; 