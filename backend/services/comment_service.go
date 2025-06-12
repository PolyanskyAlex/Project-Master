package services

import (
	"context"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

type CommentService struct {
	commentRepo *repositories.CommentRepository
	taskRepo    *repositories.TaskRepository
	logService  *OperationLogService
}

func NewCommentService(commentRepo *repositories.CommentRepository, taskRepo *repositories.TaskRepository, logService *OperationLogService) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
		taskRepo:    taskRepo,
		logService:  logService,
	}
}

func (s *CommentService) CreateComment(ctx context.Context, comment *models.Comment) error {
	// Валидация обязательных полей
	if strings.TrimSpace(comment.TaskID) == "" {
		return errors.New("task_id is required")
	}

	if strings.TrimSpace(comment.UserIdentifier) == "" {
		return errors.New("user_identifier is required")
	}

	if strings.TrimSpace(comment.Content) == "" {
		return errors.New("content is required")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	if err := s.commentRepo.Create(ctx, comment); err != nil {
		return err
	}

	// Логируем создание комментария
	if s.logService != nil {
		details := map[string]interface{}{
			"comment_id":      comment.ID,
			"task_id":         comment.TaskID,
			"user_identifier": comment.UserIdentifier,
			"content":         comment.Content,
		}
		s.logService.LogTaskOperation(ctx, comment.TaskID, comment.UserIdentifier, string(models.OperationTypeComment), details)
	}

	return nil
}

func (s *CommentService) GetCommentByID(ctx context.Context, id string) (*models.Comment, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.commentRepo.GetByID(ctx, id)
}

func (s *CommentService) GetCommentsByTaskID(ctx context.Context, taskID string) ([]models.Comment, error) {
	if strings.TrimSpace(taskID) == "" {
		return nil, errors.New("task_id is required")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, errors.New("task not found")
	}

	return s.commentRepo.GetByTaskID(ctx, taskID)
}

func (s *CommentService) GetAllComments(ctx context.Context) ([]models.Comment, error) {
	return s.commentRepo.GetAll(ctx)
}

func (s *CommentService) DeleteComment(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}

	// Проверка существования комментария
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if comment == nil {
		return errors.New("comment not found")
	}

	return s.commentRepo.Delete(ctx, id)
}
