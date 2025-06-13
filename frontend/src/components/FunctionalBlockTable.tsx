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
  Typography,
  Box,
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
import { FunctionalBlock } from '../types/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FunctionalBlockTableProps {
  functionalBlocks: FunctionalBlock[];
  onEdit: (functionalBlock: FunctionalBlock) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const FunctionalBlockTable: React.FC<FunctionalBlockTableProps> = ({
  functionalBlocks,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<FunctionalBlock | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleDeleteClick = (functionalBlock: FunctionalBlock) => {
    setSelectedBlock(functionalBlock);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedBlock) {
      onDelete(selectedBlock.id);
    }
    setDeleteDialogOpen(false);
    setSelectedBlock(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedBlock(null);
  };

  const handleViewClick = (functionalBlock: FunctionalBlock) => {
    setSelectedBlock(functionalBlock);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedBlock(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  if (!functionalBlocks || (functionalBlocks.length === 0 && !loading)) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Функциональные блоки не найдены
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Создайте первый функциональный блок, нажав кнопку "Создать"
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
              <TableCell>Название</TableCell>
              <TableCell>Префикс</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell>Обновлен</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {functionalBlocks.map((block) => (
              <TableRow key={block.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {block.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={block.prefix}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.description ? block.description : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(block.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(block.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Просмотр">
                      <IconButton
                        size="small"
                        onClick={() => handleViewClick(block)}
                        disabled={loading}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(block)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(block)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
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
            Вы уверены, что хотите удалить функциональный блок "{selectedBlock?.name}"?
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

      {/* Диалог просмотра */}
      <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle>Функциональный блок</DialogTitle>
        <DialogContent>
          {selectedBlock && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Название
                </Typography>
                <Typography variant="body1">{selectedBlock.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Префикс
                </Typography>
                <Chip
                  label={selectedBlock.prefix}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Описание
                </Typography>
                {selectedBlock.description && (
                  <Typography variant="body1">{selectedBlock.description}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Создан
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedBlock.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Обновлен
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedBlock.updatedAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Закрыть</Button>
          <Button
            onClick={() => {
              if (selectedBlock) {
                onEdit(selectedBlock);
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

export default FunctionalBlockTable; 