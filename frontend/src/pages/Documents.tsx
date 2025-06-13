import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import {
  Description as DocumentIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments';
import { useProjects } from '../hooks/useProjects';
import { DocumentForm } from '../components/DocumentForm';
import { DocumentTable } from '../components/DocumentTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { Document, CreateDocumentRequest, UpdateDocumentRequest, DocumentType } from '../types/api';

const Documents: React.FC = () => {
  const {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    fetchDocumentsByProject,
    fetchDocumentsByType,
    fetchDocuments,
    setError
  } = useDocuments();
  
  const { projects } = useProjects();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterType, setFilterType] = useState<DocumentType | ''>('');

  const handleCreateDocument = async (data: CreateDocumentRequest) => {
    await createDocument(data);
  };

  const handleUpdateDocument = async (data: UpdateDocumentRequest) => {
    if (editingDocument) {
      await updateDocument(editingDocument.id, data);
    }
  };

  const handleFormSubmit = async (data: CreateDocumentRequest | UpdateDocumentRequest) => {
    if (editingDocument) {
      await handleUpdateDocument(data as UpdateDocumentRequest);
    } else {
      await handleCreateDocument(data as CreateDocumentRequest);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingDocument(null);
    setError(null);
  };

  const handleFilterChange = React.useCallback(async () => {
    if (filterProject && filterType) {
      // Фильтр по проекту и типу не поддерживается напрямую в API
      // Загружаем все документы и фильтруем на клиенте
      await fetchDocuments();
    } else if (filterProject) {
      await fetchDocumentsByProject(filterProject);
    } else if (filterType) {
      await fetchDocumentsByType(filterType);
    } else {
      await fetchDocuments();
    }
  }, [filterProject, filterType, fetchDocuments, fetchDocumentsByProject, fetchDocumentsByType]);

  React.useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;
    
    if (filterProject && filterType) {
      filtered = documents.filter(doc => 
        doc.projectId === filterProject && doc.type === filterType
      );
    }
    
    return filtered;
  }, [documents, filterProject, filterType]);

  // const getProjectName = (projectId: string): string => {
  //   const project = projects.find(p => p.id === projectId);
  //   return project?.name || 'Неизвестный проект';
  // };

  const getDocumentStats = () => {
    const stats = {
      total: filteredDocuments.length,
      byType: {} as Record<string, number>,
      agentEditable: filteredDocuments.filter(doc => doc.agentEditable).length
    };

    filteredDocuments.forEach(doc => {
      stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
    });

    return stats;
  };

  const stats = getDocumentStats();

  if (loading && documents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <DocumentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Документы
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление документацией проектов
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Статистика */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" component="div">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Всего документов
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" component="div">
              {stats.agentEditable}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-редактируемых
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              По типам:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(stats.byType).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type}: ${count}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Панель управления */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          disabled={loading}
        >
          Создать документ
        </Button>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Фильтр по проекту</InputLabel>
          <Select
            value={filterProject}
            label="Фильтр по проекту"
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <MenuItem value="">Все проекты</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Фильтр по типу</InputLabel>
          <Select
            value={filterType}
            label="Фильтр по типу"
            onChange={(e) => setFilterType(e.target.value as DocumentType | '')}
          >
            <MenuItem value="">Все типы</MenuItem>
            <MenuItem value="BRD">BRD</MenuItem>
            <MenuItem value="SAD">SAD</MenuItem>
            <MenuItem value="AI-Ready">AI-Ready</MenuItem>
            <MenuItem value="AI Executable">AI Executable</MenuItem>
            <MenuItem value="Technical">Техническая</MenuItem>
            <MenuItem value="User Guide">Руководство</MenuItem>
            <MenuItem value="API Documentation">API Документация</MenuItem>
          </Select>
        </FormControl>

        {(filterProject || filterType) && (
          <Button
            variant="outlined"
            onClick={() => {
              setFilterProject('');
              setFilterType('');
            }}
          >
            Сбросить фильтры
          </Button>
        )}
      </Box>

      {/* Таблица документов */}
      <DocumentTable
        documents={filteredDocuments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Форма создания/редактирования */}
      <DocumentForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        document={editingDocument || undefined}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default Documents; 