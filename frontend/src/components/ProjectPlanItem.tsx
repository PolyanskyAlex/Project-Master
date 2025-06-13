import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Remove as RemoveIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectPlanItem as PlanItem } from '../types/api';

interface ProjectPlanItemProps {
  item: PlanItem;
  index: number;
  onRemove: (taskId: string) => void;
  onView: (item: PlanItem) => void;
}

export const ProjectPlanItemComponent: React.FC<ProjectPlanItemProps> = ({
  item,
  index,
  onRemove,
  onView
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Планирование': return 'info';
      case 'В разработке': return 'success';
      case 'Тестирование': return 'warning';
      case 'Завершен': return 'secondary';
      case 'Приостановлен': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      'Низкий': 'success',
      'Средний': 'primary',
      'Высокий': 'warning',
      'Критический': 'error'
    };
    return colors[priority] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      'Новый функционал': 'primary',
      'Исправление ошибки': 'error',
      'Улучшение': 'success',
      'Рефакторинг': 'secondary',
      'Документация': 'default'
    };
    return colors[type] || 'default';
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Drag Handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': {
                cursor: 'grabbing'
              }
            }}
          >
            <DragIcon fontSize="small" />
          </Box>

          {/* Номер позиции */}
          <Box
            sx={{
              minWidth: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            {item.sequenceOrder}
          </Box>

          {/* Основное содержимое */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {item.taskNumber}
              </Typography>
              <Chip
                label={item.taskStatus}
                color={getStatusColor(item.taskStatus)}
                size="small"
              />
              <Chip
                label={item.taskPriority}
                color={getPriorityColor(item.taskPriority)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={item.taskType}
                color={getTypeColor(item.taskType)}
                size="small"
                variant="outlined"
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
              {item.taskTitle}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {truncateText(item.taskDescription)}
            </Typography>
          </Box>

          {/* Действия */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Tooltip title="Просмотреть задачу">
              <IconButton
                size="small"
                onClick={() => onView(item)}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить из плана">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(item.taskId)}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 