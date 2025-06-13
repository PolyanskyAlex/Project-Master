import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Document, CreateDocumentRequest, UpdateDocumentRequest, DocumentType } from '../types/api';
import { useProjects } from '../hooks/useProjects';
import { useDocumentTypes } from '../hooks/useDocuments';

interface DocumentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDocumentRequest | UpdateDocumentRequest) => Promise<void>;
  document?: Document;
  loading?: boolean;
  error?: string | null;
}

const schema = yup.object({
  projectId: yup.string().required('Проект обязателен'),
  title: yup.string().required('Название обязательно').min(3, 'Минимум 3 символа'),
  content: yup.string().required('Содержимое обязательно').min(10, 'Минимум 10 символов'),
  type: yup.string().oneOf(['BRD', 'SAD', 'AI-Ready', 'AI Executable', 'Technical', 'User Guide', 'API Documentation']).required('Тип документа обязателен'),
  agentEditable: yup.boolean().required()
});

type FormData = {
  projectId: string;
  title: string;
  content: string;
  type: DocumentType;
  agentEditable: boolean;
};

export const DocumentForm: React.FC<DocumentFormProps> = ({
  open,
  onClose,
  onSubmit,
  document,
  loading = false,
  error
}) => {
  const { projects } = useProjects();
  const { documentTypes } = useDocumentTypes();
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      projectId: '',
      title: '',
      content: '',
      type: 'Technical' as DocumentType,
      agentEditable: false
    }
  });

  useEffect(() => {
    if (document) {
      reset({
        projectId: document.projectId,
        title: document.title,
        content: document.content,
        type: document.type,
        agentEditable: document.agentEditable
      });
    } else {
      reset({
        projectId: '',
        title: '',
        content: '',
        type: 'Technical' as DocumentType,
        agentEditable: false
      });
    }
  }, [document, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      'BRD': 'Бизнес-требования (BRD)',
      'SAD': 'Системная архитектура (SAD)',
      'AI-Ready': 'AI-Ready документ',
      'AI Executable': 'AI Executable план',
      'Technical': 'Техническая документация',
      'User Guide': 'Руководство пользователя',
      'API Documentation': 'API документация'
    };
    return labels[type] || type;
  };

  // const getProjectName = (projectId: string): string => {
  //   const project = (projects || []).find(p => p.id === projectId);
  //   return project?.name || 'Неизвестный проект';
  // };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {document ? 'Редактировать документ' : 'Создать документ'}
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
              name="projectId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.projectId}>
                  <InputLabel>Проект</InputLabel>
                  <Select
                    {...field}
                    label="Проект"
                    disabled={loading}
                  >
                    {(projects || []).map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.projectId && (
                    <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                      {errors.projectId.message}
                    </Box>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Название документа"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  disabled={loading}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Тип документа</InputLabel>
                  <Select
                    {...field}
                    label="Тип документа"
                    disabled={loading}
                  >
                    {/* Фиксированные типы документов, если API не отвечает */}
                    {documentTypes.length > 0 ? (
                      documentTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {getDocumentTypeLabel(type)}
                        </MenuItem>
                      ))
                    ) : (
                      [
                        <MenuItem key="BRD" value="BRD">Бизнес-требования (BRD)</MenuItem>,
                        <MenuItem key="SAD" value="SAD">Системная архитектура (SAD)</MenuItem>,
                        <MenuItem key="AI-Ready" value="AI-Ready">AI-Ready документ</MenuItem>,
                        <MenuItem key="AI Executable" value="AI Executable">AI Executable план</MenuItem>,
                        <MenuItem key="Technical" value="Technical">Техническая документация</MenuItem>,
                        <MenuItem key="User Guide" value="User Guide">Руководство пользователя</MenuItem>,
                        <MenuItem key="API Documentation" value="API Documentation">API документация</MenuItem>
                      ]
                    )}
                  </Select>
                  {errors.type && (
                    <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                      {errors.type.message}
                    </Box>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Содержимое документа"
                  fullWidth
                  multiline
                  rows={8}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  disabled={loading}
                />
              )}
            />

            <Controller
              name="agentEditable"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      {...field}
                      checked={field.value}
                      disabled={loading}
                    />
                  }
                  label="Доступен для редактирования ИИ-агентом"
                />
              )}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isValid}
          >
            {loading ? 'Сохранение...' : (document ? 'Обновить' : 'Создать')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 