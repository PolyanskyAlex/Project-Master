import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Assignment } from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import ProjectTable from '../components/ProjectTable';
import ProjectForm from '../components/ProjectForm';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../types/api';

const Projects: React.FC = () => {
  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProject(null);
  };

  const handleFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    try {
      if (editingProject) {
        // Редактирование
        const result = await updateProject(editingProject.id, data as UpdateProjectRequest);
        if (result) {
          setSnackbar({
            open: true,
            message: 'Проект успешно обновлен',
            severity: 'success',
          });
        }
      } else {
        // Создание
        const result = await createProject(data as CreateProjectRequest);
        if (result) {
          setSnackbar({
            open: true,
            message: 'Проект успешно создан',
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
    const success = await deleteProject(id);
    if (success) {
      setSnackbar({
        open: true,
        message: 'Проект успешно удален',
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

  if (loading && projects.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      {/* Заголовок и кнопка создания */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <Assignment sx={{ mr: 2, verticalAlign: 'middle' }} />
            Проекты
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление проектами разработки
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

      {/* Таблица проектов */}
      <ProjectTable
        projects={projects}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      {/* Форма создания/редактирования */}
      <ProjectForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        project={editingProject}
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

export default Projects; 