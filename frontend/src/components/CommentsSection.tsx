import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useComments } from '../hooks/useComments';
import { CreateCommentRequest } from '../types/api';

interface CommentsSectionProps {
  taskId: string;
  taskTitle?: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  taskId,
  taskTitle,
}) => {
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    comments,
    loading,
    error,
    createComment,
    refreshComments,
  } = useComments(taskId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !author.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const commentData: CreateCommentRequest = {
      taskId,
      content: newComment.trim(),
      author: author.trim(),
    };

    const result = await createComment(commentData);
    
    if (result) {
      setNewComment('');
      // Сохраняем автора для следующих комментариев
      localStorage.setItem('commentAuthor', author);
    }
    
    setIsSubmitting(false);
  };

  // Загружаем сохраненного автора при монтировании
  React.useEffect(() => {
    const savedAuthor = localStorage.getItem('commentAuthor');
    if (savedAuthor) {
      setAuthor(savedAuthor);
    }
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return 'Неизвестно';
    }
  };

  const getAvatarColor = (author: string) => {
    // Генерируем цвет на основе имени автора
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const index = author.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getInitials = (author: string) => {
    return author
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CommentIcon color="primary" />
          <Typography variant="h6">
            Комментарии
          </Typography>
          {taskTitle && (
            <Typography variant="body2" color="text.secondary">
              к задаче "{taskTitle}"
            </Typography>
          )}
        </Box>
        <Tooltip title="Обновить комментарии">
          <IconButton onClick={refreshComments} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Форма добавления комментария */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Добавить комментарий
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Ваше имя"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              size="small"
              required
              disabled={isSubmitting}
            />
            <TextField
              label="Комментарий"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              multiline
              rows={3}
              required
              disabled={isSubmitting}
              placeholder="Введите ваш комментарий..."
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
                disabled={isSubmitting || !newComment.trim() || !author.trim()}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Список комментариев */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Комментариев пока нет. Будьте первым!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comments.map((comment, index) => (
            <Box key={comment.id}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(comment.author),
                    width: 40,
                    height: 40,
                    fontSize: '0.875rem',
                  }}
                >
                  {getInitials(comment.author)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {comment.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Box>
              {index < comments.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default CommentsSection; 