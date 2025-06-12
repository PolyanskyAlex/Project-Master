import React, { useState, useEffect } from 'react';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useProjects } from '../hooks/useProjects';
import { useProjectPlan } from '../hooks/useProjectPlan';
import { ProjectPlanItemComponent } from '../components/ProjectPlanItem';
import { AddTasksToPlanDialog } from '../components/AddTasksToPlanDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { ProjectPlanItem, ReorderRequest, TaskSequence } from '../types/api';

const DevelopmentPlan: React.FC = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [addTasksDialogOpen, setAddTasksDialogOpen] = useState(false);
  const [viewTaskDialog, setViewTaskDialog] = useState<ProjectPlanItem | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    plan,
    stats,
    loading,
    error,
    fetchProjectPlan,
    fetchProjectPlanStats,
    addMultipleTasksToPlan,
    removeTaskFromPlan,
    reorderTasks,
    updateLocalOrder,
    setError
  } = useProjectPlan(selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectPlan(selectedProjectId);
      fetchProjectPlanStats(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectPlan, fetchProjectPlanStats]);

  const handleProjectChange = (projectId: string) => {
    if (hasUnsavedChanges) {
      if (window.confirm('У вас есть несохраненные изменения. Продолжить?')) {
        setSelectedProjectId(projectId);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedProjectId(projectId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !plan || active.id === over.id) return;

    const oldIndex = plan.items.findIndex(item => item.id === active.id);
    const newIndex = plan.items.findIndex(item => item.id === over.id);

    const updatedItems = arrayMove(plan.items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sequenceOrder: index + 1
    }));

    updateLocalOrder(updatedItems);
    setHasUnsavedChanges(true);
  };

  const handleSaveOrder = async () => {
    if (!plan || !selectedProjectId) return;

    try {
      const taskSequences: TaskSequence[] = plan.items.map((item, index) => ({
        taskId: item.taskId,
        sequenceOrder: index + 1
      }));

      const reorderRequest: ReorderRequest = { taskSequences };
      await reorderTasks(reorderRequest, selectedProjectId);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  };

  const handleAddTasks = async (taskIds: string[]) => {
    if (!selectedProjectId) return;

    try {
      await addMultipleTasksToPlan(taskIds, selectedProjectId);
      setAddTasksDialogOpen(false);
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    if (!selectedProjectId) return;

    try {
      await removeTaskFromPlan(taskId, selectedProjectId);
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  };

  const handleRefresh = () => {
    if (selectedProjectId) {
      fetchProjectPlan(selectedProjectId);
      fetchProjectPlanStats(selectedProjectId);
      setHasUnsavedChanges(false);
    }
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === selectedProjectId);
  };

  const selectedProject = getSelectedProject();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <TimelineIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          План разработки
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Планирование и отслеживание прогресса проектов
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Выбор проекта */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Выберите проект</InputLabel>
              <Select
                value={selectedProjectId}
                label="Выберите проект"
                onChange={(e) => handleProjectChange(e.target.value)}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {project.name}
                      <Chip
                        label={project.status}
                        size="small"
                        color={project.status === 'В разработке' ? 'primary' : 'default'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProjectId && (
              <>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddTasksDialogOpen(true)}
                  disabled={loading}
                >
                  Добавить задачи
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Обновить
                </Button>

                {hasUnsavedChanges && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveOrder}
                    disabled={loading}
                  >
                    Сохранить порядок
                  </Button>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Статистика */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Статистика плана
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Всего задач: ${stats.total_tasks}`} color="primary" />
              {Object.entries(stats.status_distribution).map(([status, count]) => (
                <Chip
                  key={status}
                  label={`${status}: ${count}`}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* План разработки */}
      {selectedProjectId ? (
        loading && !plan ? (
          <LoadingSpinner message="Загрузка плана разработки..." />
        ) : plan && plan.items.length > 0 ? (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              План разработки проекта "{selectedProject?.name}"
            </Typography>
            
            {hasUnsavedChanges && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                У вас есть несохраненные изменения порядка задач. Не забудьте сохранить!
              </Alert>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={plan.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {plan.items.map((item, index) => (
                  <ProjectPlanItemComponent
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={handleRemoveTask}
                    onView={setViewTaskDialog}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Paper>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              План разработки пуст
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте задачи в план разработки для начала работы
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddTasksDialogOpen(true)}
            >
              Добавить задачи
            </Button>
          </Paper>
        )
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Выберите проект
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите проект из списка выше для просмотра плана разработки
          </Typography>
        </Paper>
      )}

      {/* Диалог добавления задач */}
      {selectedProjectId && (
        <AddTasksToPlanDialog
          open={addTasksDialogOpen}
          onClose={() => setAddTasksDialogOpen(false)}
          onAddTasks={handleAddTasks}
          projectId={selectedProjectId}
          existingTaskIds={plan?.items.map(item => item.taskId) || []}
          loading={loading}
        />
      )}

      {/* Диалог просмотра задачи */}
      <Dialog
        open={!!viewTaskDialog}
        onClose={() => setViewTaskDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewTaskDialog?.taskNumber}
            <Chip
              label={viewTaskDialog?.taskStatus}
              size="small"
              color="primary"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {viewTaskDialog?.taskTitle}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {viewTaskDialog?.taskDescription}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`Приоритет: ${viewTaskDialog?.taskPriority}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Тип: ${viewTaskDialog?.taskType}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Позиция: ${viewTaskDialog?.sequenceOrder}`}
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTaskDialog(null)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DevelopmentPlan; 