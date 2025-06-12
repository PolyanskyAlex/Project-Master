package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

type OperationLogService struct {
	logRepo  *repositories.OperationLogRepository
	taskRepo *repositories.TaskRepository
}

func NewOperationLogService(logRepo *repositories.OperationLogRepository, taskRepo *repositories.TaskRepository) *OperationLogService {
	return &OperationLogService{
		logRepo:  logRepo,
		taskRepo: taskRepo,
	}
}

func (s *OperationLogService) CreateLog(ctx context.Context, log *models.OperationLog) error {
	// Валидация обязательных полей
	if strings.TrimSpace(log.TaskID) == "" {
		return errors.New("task_id is required")
	}

	if strings.TrimSpace(log.UserIdentifier) == "" {
		return errors.New("user_identifier is required")
	}

	if strings.TrimSpace(log.OperationType) == "" {
		return errors.New("operation_type is required")
	}

	// Валидация типа операции
	if !models.IsValidOperationType(log.OperationType) {
		return errors.New("invalid operation_type")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, log.TaskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	return s.logRepo.Create(ctx, log)
}

// LogTaskOperation автоматически создает лог операции для задачи
func (s *OperationLogService) LogTaskOperation(ctx context.Context, taskID, userIdentifier, operationType string, details interface{}) error {
	detailsJSON, err := json.Marshal(details)
	if err != nil {
		return err
	}

	log := &models.OperationLog{
		TaskID:         taskID,
		UserIdentifier: userIdentifier,
		OperationType:  operationType,
		Details:        detailsJSON,
	}

	return s.CreateLog(ctx, log)
}

func (s *OperationLogService) GetLogByID(ctx context.Context, id string) (*models.OperationLog, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.logRepo.GetByID(ctx, id)
}

func (s *OperationLogService) GetLogsByTaskID(ctx context.Context, taskID string) ([]models.OperationLog, error) {
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

	return s.logRepo.GetByTaskID(ctx, taskID)
}

func (s *OperationLogService) GetAllLogs(ctx context.Context) ([]models.OperationLog, error) {
	return s.logRepo.GetAll(ctx)
}

func (s *OperationLogService) GetLogsByOperationType(ctx context.Context, operationType string) ([]models.OperationLog, error) {
	if strings.TrimSpace(operationType) == "" {
		return nil, errors.New("operation_type is required")
	}

	// Валидация типа операции
	if !models.IsValidOperationType(operationType) {
		return nil, errors.New("invalid operation_type")
	}

	return s.logRepo.GetByOperationType(ctx, operationType)
}

func (s *OperationLogService) GetLogsByUserIdentifier(ctx context.Context, userIdentifier string) ([]models.OperationLog, error) {
	if strings.TrimSpace(userIdentifier) == "" {
		return nil, errors.New("user_identifier is required")
	}

	return s.logRepo.GetByUserIdentifier(ctx, userIdentifier)
}

// GetValidOperationTypes возвращает список валидных типов операций
func (s *OperationLogService) GetValidOperationTypes() []string {
	return models.ValidOperationTypes()
}
