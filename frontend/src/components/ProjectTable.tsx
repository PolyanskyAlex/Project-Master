import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Project, ProjectStatus } from '../types/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // const handleDeleteClick = (project: Project) => {
  //   setSelectedProject(project);
  //   setDeleteDialogOpen(true);
  // };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
      onDelete(selectedProject.id);
    }
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  // const handleViewClick = (project: Project) => {
  //   setSelectedProject(project);
  //   setViewDialogOpen(true);
  // };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedProject(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Планирование': return 'info';
      case 'В разработке': return 'success';
      case 'Тестирование': return 'warning';
      case 'Завершен': return 'secondary';
      case 'Приостановлен': return 'error';
      default: return 'default';
    }
  };

  if (!projects || (projects.length === 0 && !loading)) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Проекты не найдены
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Создайте первый проект, нажав кнопку "Создать"
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
              <TableCell>Описание</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell>Обновлен</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {project.name}
                  </Typography>
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
                    {project.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    size="small"
                    color={getStatusColor(project.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(project.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(project.updatedAt)}
                  </Typography>
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
            Вы уверены, что хотите удалить проект "{selectedProject?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить. Все связанные задачи и документы также будут удалены.
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
        <DialogTitle>Проект</DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Название
                </Typography>
                <Typography variant="body1">{selectedProject.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Описание
                </Typography>
                <Typography variant="body1">{selectedProject.description}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Статус
                </Typography>
                <Chip
                  label={selectedProject.status}
                  size="small"
                  color={getStatusColor(selectedProject.status)}
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Создан
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedProject.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Обновлен
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedProject.updatedAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Закрыть</Button>
          <Button
            onClick={() => {
              if (selectedProject) {
                onEdit(selectedProject);
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

export default ProjectTable; 