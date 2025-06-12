import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, AccountTree } from '@mui/icons-material';
import { useFunctionalBlocks } from '../hooks/useFunctionalBlocks';
import FunctionalBlockTable from '../components/FunctionalBlockTable';
import FunctionalBlockForm from '../components/FunctionalBlockForm';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FunctionalBlock,
  CreateFunctionalBlockRequest,
  UpdateFunctionalBlockRequest,
} from '../types/api';

const FunctionalBlocks: React.FC = () => {
  const {
    functionalBlocks,
    loading,
    error,
    createFunctionalBlock,
    updateFunctionalBlock,
    deleteFunctionalBlock,
  } = useFunctionalBlocks();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<FunctionalBlock | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreateClick = () => {
    setEditingBlock(null);
    setFormOpen(true);
  };

  const handleEditClick = (functionalBlock: FunctionalBlock) => {
    setEditingBlock(functionalBlock);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBlock(null);
  };

  const handleFormSubmit = async (data: CreateFunctionalBlockRequest | UpdateFunctionalBlockRequest) => {
    try {
      if (editingBlock) {
        // Редактирование
        const result = await updateFunctionalBlock(editingBlock.id, data as UpdateFunctionalBlockRequest);
        if (result) {
          setSnackbar({
            open: true,
            message: 'Функциональный блок успешно обновлен',
            severity: 'success',
          });
        }
      } else {
        // Создание
        const result = await createFunctionalBlock(data as CreateFunctionalBlockRequest);
        if (result) {
          setSnackbar({
            open: true,
            message: 'Функциональный блок успешно создан',
            severity: 'success',
          });
        }
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при сохранении',
        severity: 'error',
      });
    }
  };

  const handleDeleteClick = async (id: string) => {
    const success = await deleteFunctionalBlock(id);
    if (success) {
      setSnackbar({
        open: true,
        message: 'Функциональный блок успешно удален',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при удалении',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && functionalBlocks.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      {/* Заголовок и кнопка создания */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <AccountTree sx={{ mr: 2, verticalAlign: 'middle' }} />
            Функциональные блоки
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление функциональными блоками системы
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          disabled={loading}
        >
          Создать
        </Button>
      </Box>

      {/* Ошибка загрузки */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Таблица функциональных блоков */}
      <FunctionalBlockTable
        functionalBlocks={functionalBlocks}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      {/* Форма создания/редактирования */}
      <FunctionalBlockForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        functionalBlock={editingBlock}
        loading={loading}
        error={error}
      />

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FunctionalBlocks; 