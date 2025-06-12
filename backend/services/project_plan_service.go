package services

import (
	"context"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

type ProjectPlanService struct {
	planRepo    *repositories.ProjectPlanRepository
	projectRepo *repositories.ProjectRepository
	taskRepo    *repositories.TaskRepository
}

func NewProjectPlanService(planRepo *repositories.ProjectPlanRepository, projectRepo *repositories.ProjectRepository, taskRepo *repositories.TaskRepository) *ProjectPlanService {
	return &ProjectPlanService{
		planRepo:    planRepo,
		projectRepo: projectRepo,
		taskRepo:    taskRepo,
	}
}

func (s *ProjectPlanService) AddTaskToPlan(ctx context.Context, projectID, taskID string) error {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return errors.New("project_id is required")
	}

	if strings.TrimSpace(taskID) == "" {
		return errors.New("task_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	// Проверка, что задача принадлежит проекту
	if task.ProjectID != projectID {
		return errors.New("task does not belong to the specified project")
	}

	// Проверка, что задача еще не в плане
	inPlan, err := s.planRepo.IsTaskInPlan(ctx, projectID, taskID)
	if err != nil {
		return err
	}
	if inPlan {
		return errors.New("task is already in the project plan")
	}

	return s.planRepo.AddTaskToPlan(ctx, projectID, taskID)
}

func (s *ProjectPlanService) RemoveTaskFromPlan(ctx context.Context, projectID, taskID string) error {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return errors.New("project_id is required")
	}

	if strings.TrimSpace(taskID) == "" {
		return errors.New("task_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	// Проверка, что задача в плане
	inPlan, err := s.planRepo.IsTaskInPlan(ctx, projectID, taskID)
	if err != nil {
		return err
	}
	if !inPlan {
		return errors.New("task is not in the project plan")
	}

	return s.planRepo.RemoveTaskFromPlan(ctx, projectID, taskID)
}

func (s *ProjectPlanService) GetProjectPlan(ctx context.Context, projectID string) (*models.ProjectPlan, error) {
	// Валидация входных данных
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

	return s.planRepo.GetProjectPlan(ctx, projectID)
}

func (s *ProjectPlanService) ReorderTasks(ctx context.Context, projectID string, reorderRequest *models.ReorderRequest) error {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return errors.New("project_id is required")
	}

	if reorderRequest == nil || len(reorderRequest.TaskSequences) == 0 {
		return errors.New("task sequences are required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	// Валидация всех задач в запросе
	for _, taskSeq := range reorderRequest.TaskSequences {
		if strings.TrimSpace(taskSeq.TaskID) == "" {
			return errors.New("all task IDs are required")
		}

		if taskSeq.SequenceOrder <= 0 {
			return errors.New("sequence order must be positive")
		}

		// Проверка, что задача существует и принадлежит проекту
		task, err := s.taskRepo.GetByID(ctx, taskSeq.TaskID)
		if err != nil {
			return err
		}
		if task == nil {
			return errors.New("task not found: " + taskSeq.TaskID)
		}
		if task.ProjectID != projectID {
			return errors.New("task does not belong to the specified project: " + taskSeq.TaskID)
		}

		// Проверка, что задача в плане
		inPlan, err := s.planRepo.IsTaskInPlan(ctx, projectID, taskSeq.TaskID)
		if err != nil {
			return err
		}
		if !inPlan {
			return errors.New("task is not in the project plan: " + taskSeq.TaskID)
		}
	}

	// Проверка уникальности порядковых номеров
	orderMap := make(map[int]bool)
	for _, taskSeq := range reorderRequest.TaskSequences {
		if orderMap[taskSeq.SequenceOrder] {
			return errors.New("duplicate sequence order found")
		}
		orderMap[taskSeq.SequenceOrder] = true
	}

	return s.planRepo.ReorderTasks(ctx, projectID, reorderRequest.TaskSequences)
}

func (s *ProjectPlanService) MoveTaskToPosition(ctx context.Context, projectID, taskID string, newPosition int) error {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return errors.New("project_id is required")
	}

	if strings.TrimSpace(taskID) == "" {
		return errors.New("task_id is required")
	}

	if newPosition <= 0 {
		return errors.New("position must be positive")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	// Проверка, что задача принадлежит проекту
	if task.ProjectID != projectID {
		return errors.New("task does not belong to the specified project")
	}

	// Проверка, что задача в плане
	inPlan, err := s.planRepo.IsTaskInPlan(ctx, projectID, taskID)
	if err != nil {
		return err
	}
	if !inPlan {
		return errors.New("task is not in the project plan")
	}

	return s.planRepo.MoveTaskToPosition(ctx, projectID, taskID, newPosition)
}

func (s *ProjectPlanService) GetTaskPosition(ctx context.Context, projectID, taskID string) (int, error) {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return 0, errors.New("project_id is required")
	}

	if strings.TrimSpace(taskID) == "" {
		return 0, errors.New("task_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return 0, err
	}
	if project == nil {
		return 0, errors.New("project not found")
	}

	// Проверка существования задачи
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return 0, err
	}
	if task == nil {
		return 0, errors.New("task not found")
	}

	// Проверка, что задача принадлежит проекту
	if task.ProjectID != projectID {
		return 0, errors.New("task does not belong to the specified project")
	}

	return s.planRepo.GetTaskPosition(ctx, projectID, taskID)
}

func (s *ProjectPlanService) IsTaskInPlan(ctx context.Context, projectID, taskID string) (bool, error) {
	// Валидация входных данных
	if strings.TrimSpace(projectID) == "" {
		return false, errors.New("project_id is required")
	}

	if strings.TrimSpace(taskID) == "" {
		return false, errors.New("task_id is required")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return false, err
	}
	if project == nil {
		return false, errors.New("project not found")
	}

	return s.planRepo.IsTaskInPlan(ctx, projectID, taskID)
}
