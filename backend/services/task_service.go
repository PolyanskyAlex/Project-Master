package services

import (
	"context"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

type TaskService struct {
	taskRepo    *repositories.TaskRepository
	projectRepo *repositories.ProjectRepository
	fbRepo      *repositories.FunctionalBlockRepository
	logService  *OperationLogService
}

func NewTaskService(taskRepo *repositories.TaskRepository, projectRepo *repositories.ProjectRepository, fbRepo *repositories.FunctionalBlockRepository, logService *OperationLogService) *TaskService {
	return &TaskService{
		taskRepo:    taskRepo,
		projectRepo: projectRepo,
		fbRepo:      fbRepo,
		logService:  logService,
	}
}

func (s *TaskService) CreateTask(ctx context.Context, task *models.Task) error {
	// Валидация обязательных полей
	if strings.TrimSpace(task.Title) == "" {
		return errors.New("title is required")
	}

	if strings.TrimSpace(task.ProjectID) == "" {
		return errors.New("project_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, task.ProjectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	// Проверка существования функционального блока (если указан)
	if task.FunctionalBlockID != nil && *task.FunctionalBlockID != "" {
		fb, err := s.fbRepo.GetByID(ctx, *task.FunctionalBlockID)
		if err != nil {
			return err
		}
		if fb == nil {
			return errors.New("functional block not found")
		}
	}

	// Проверка родительской задачи (если указана)
	if task.ParentTaskID != nil && *task.ParentTaskID != "" {
		parentTask, err := s.taskRepo.GetByID(ctx, *task.ParentTaskID)
		if err != nil {
			return err
		}
		if parentTask == nil {
			return errors.New("parent task not found")
		}
	}

	// Установка значений по умолчанию
	if task.Status == "" {
		task.Status = string(models.TaskStatusNew)
	}
	if task.Priority == "" {
		task.Priority = string(models.TaskPriorityMedium)
	}
	if task.Type == "" {
		task.Type = string(models.TaskTypeNewFeature)
	}

	// Валидация статуса
	if !models.IsValidStatus(task.Status) {
		return errors.New("invalid status")
	}

	// Валидация приоритета
	if !models.IsValidPriority(task.Priority) {
		return errors.New("invalid priority")
	}

	// Валидация типа
	if !models.IsValidType(task.Type) {
		return errors.New("invalid type")
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return err
	}

	// Логируем создание задачи
	if s.logService != nil {
		details := map[string]interface{}{
			"task_id": task.ID,
			"title":   task.Title,
			"status":  task.Status,
		}
		s.logService.LogTaskOperation(ctx, task.ID, "system", string(models.OperationTypeCreate), details)
	}

	return nil
}

func (s *TaskService) GetTaskByID(ctx context.Context, id string) (*models.Task, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.taskRepo.GetByID(ctx, id)
}

func (s *TaskService) GetTaskByNumber(ctx context.Context, number string) (*models.Task, error) {
	if strings.TrimSpace(number) == "" {
		return nil, errors.New("number is required")
	}
	return s.taskRepo.GetByNumber(ctx, number)
}

func (s *TaskService) GetAllTasks(ctx context.Context) ([]models.Task, error) {
	return s.taskRepo.GetAll(ctx)
}

func (s *TaskService) GetTasksByProjectID(ctx context.Context, projectID string) ([]models.Task, error) {
	if strings.TrimSpace(projectID) == "" {
		return nil, errors.New("project_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return s.taskRepo.GetByProjectID(ctx, projectID)
}

func (s *TaskService) GetTasksByStatus(ctx context.Context, status string) ([]models.Task, error) {
	if strings.TrimSpace(status) == "" {
		return nil, errors.New("status is required")
	}

	// Валидация статуса
	if !models.IsValidStatus(status) {
		return nil, errors.New("invalid status")
	}

	return s.taskRepo.GetByStatus(ctx, status)
}

func (s *TaskService) GetTasksByFunctionalBlockID(ctx context.Context, functionalBlockID string) ([]models.Task, error) {
	if strings.TrimSpace(functionalBlockID) == "" {
		return nil, errors.New("functional_block_id is required")
	}

	// Проверка существования функционального блока
	fb, err := s.fbRepo.GetByID(ctx, functionalBlockID)
	if err != nil {
		return nil, err
	}
	if fb == nil {
		return nil, errors.New("functional block not found")
	}

	return s.taskRepo.GetByFunctionalBlockID(ctx, functionalBlockID)
}

func (s *TaskService) UpdateTask(ctx context.Context, task *models.Task) error {
	// Валидация обязательных полей
	if strings.TrimSpace(task.ID) == "" {
		return errors.New("id is required")
	}

	if strings.TrimSpace(task.Title) == "" {
		return errors.New("title is required")
	}

	// Проверка существования задачи
	existingTask, err := s.taskRepo.GetByID(ctx, task.ID)
	if err != nil {
		return err
	}
	if existingTask == nil {
		return errors.New("task not found")
	}

	// Проверка существования функционального блока (если указан)
	if task.FunctionalBlockID != nil && *task.FunctionalBlockID != "" {
		fb, err := s.fbRepo.GetByID(ctx, *task.FunctionalBlockID)
		if err != nil {
			return err
		}
		if fb == nil {
			return errors.New("functional block not found")
		}
	}

	// Проверка родительской задачи (если указана)
	if task.ParentTaskID != nil && *task.ParentTaskID != "" {
		// Проверяем, что задача не ссылается сама на себя
		if *task.ParentTaskID == task.ID {
			return errors.New("task cannot be parent of itself")
		}

		parentTask, err := s.taskRepo.GetByID(ctx, *task.ParentTaskID)
		if err != nil {
			return err
		}
		if parentTask == nil {
			return errors.New("parent task not found")
		}
	}

	// Валидация статуса
	if task.Status != "" && !models.IsValidStatus(task.Status) {
		return errors.New("invalid status")
	}

	// Валидация приоритета
	if task.Priority != "" && !models.IsValidPriority(task.Priority) {
		return errors.New("invalid priority")
	}

	// Валидация типа
	if task.Type != "" && !models.IsValidType(task.Type) {
		return errors.New("invalid type")
	}

	// Сохраняем неизменяемые поля
	task.ProjectID = existingTask.ProjectID
	task.Number = existingTask.Number
	task.CreatedAt = existingTask.CreatedAt

	// Проверяем изменение статуса для специального логирования
	statusChanged := existingTask.Status != task.Status

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return err
	}

	// Логируем обновление задачи
	if s.logService != nil {
		details := map[string]interface{}{
			"task_id":    task.ID,
			"old_status": existingTask.Status,
			"new_status": task.Status,
			"title":      task.Title,
		}
		s.logService.LogTaskOperation(ctx, task.ID, "system", string(models.OperationTypeUpdate), details)

		// Дополнительное логирование изменения статуса
		if statusChanged {
			statusDetails := map[string]interface{}{
				"task_id":    task.ID,
				"old_status": existingTask.Status,
				"new_status": task.Status,
			}
			s.logService.LogTaskOperation(ctx, task.ID, "system", string(models.OperationTypeStatusChange), statusDetails)
		}
	}

	return nil
}

func (s *TaskService) DeleteTask(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	if err := s.taskRepo.Delete(ctx, id); err != nil {
		return err
	}

	// Логируем удаление задачи
	if s.logService != nil {
		details := map[string]interface{}{
			"task_id": task.ID,
			"title":   task.Title,
			"number":  task.Number,
		}
		s.logService.LogTaskOperation(ctx, task.ID, "system", string(models.OperationTypeDelete), details)
	}

	return nil
}

// GetValidStatuses возвращает список валидных статусов
func (s *TaskService) GetValidStatuses() []string {
	return models.ValidStatuses()
}

// GetValidPriorities возвращает список валидных приоритетов
func (s *TaskService) GetValidPriorities() []string {
	return models.ValidPriorities()
}

// GetValidTypes возвращает список валидных типов
func (s *TaskService) GetValidTypes() []string {
	return models.ValidTypes()
}
