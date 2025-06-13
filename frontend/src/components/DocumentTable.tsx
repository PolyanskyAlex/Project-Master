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
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import { Document, DocumentType } from '../types/api';

interface DocumentTableProps {
  documents: Document[];
  onEdit: (document: Document) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onEdit,
  onDelete,
  loading = false
}) => {
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      'BRD': 'BRD',
      'SAD': 'SAD',
      'AI-Ready': 'AI-Ready',
      'AI Executable': 'AI Executable',
      'Technical': 'Техническая',
      'User Guide': 'Руководство',
      'API Documentation': 'API Документация'
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
      'BRD': 'primary',
      'SAD': 'secondary',
      'AI-Ready': 'success',
      'AI Executable': 'warning',
      'Technical': 'info',
      'User Guide': 'primary',
      'API Documentation': 'secondary'
    };
    return colors[type] || 'default';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const truncateContent = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!documents || documents.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Документы не найдены
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Создайте первый документ для начала работы
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
              <TableCell>Тип</TableCell>
              <TableCell>Содержимое</TableCell>
              <TableCell>AI-редактируемый</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell>Обновлен</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(documents || []).map((document) => (
              <TableRow key={document.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {document.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDocumentTypeLabel(document.type)}
                    color={getDocumentTypeColor(document.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {truncateContent(document.content)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {document.agentEditable && (
                    <Tooltip title="Доступен для редактирования ИИ-агентом">
                      <AIIcon color="primary" fontSize="small" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(document.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(document.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Просмотреть">
                      <IconButton
                        size="small"
                        onClick={() => setViewDocument(document)}
                        disabled={loading}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(document)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirm(document.id)}
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

      {/* Диалог просмотра документа */}
      <Dialog
        open={!!viewDocument}
        onClose={() => setViewDocument(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewDocument?.title}
            <Chip
              label={viewDocument ? getDocumentTypeLabel(viewDocument.type) : ''}
              color={viewDocument ? getDocumentTypeColor(viewDocument.type) : 'default'}
              size="small"
            />
            {viewDocument?.agentEditable && (
              <Tooltip title="Доступен для редактирования ИИ-агентом">
                <AIIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Создан: {viewDocument && formatDate(viewDocument.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Обновлен: {viewDocument && formatDate(viewDocument.updatedAt)}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {viewDocument?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDocument(null)}>
            Закрыть
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (viewDocument) {
                onEdit(viewDocument);
                setViewDocument(null);
              }
            }}
          >
            Редактировать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Подтвердите удаление</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>
            Отмена
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 