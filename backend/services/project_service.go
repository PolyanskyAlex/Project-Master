package services

import (
	"context"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

var validProjectStatuses = map[string]bool{
	"Планирование":  true,
	"В разработке":  true,
	"Тестирование":  true,
	"Завершен":      true,
	"Приостановлен": true,
}

type ProjectService struct {
	repo *repositories.ProjectRepository
}

func NewProjectService(repo *repositories.ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

func (s *ProjectService) CreateProject(ctx context.Context, project *models.Project) error {
	// Валидация имени
	if strings.TrimSpace(project.Name) == "" {
		return errors.New("name is required")
	}

	// Установка статуса по умолчанию
	if project.Status == "" {
		project.Status = "Новый"
	}

	// Валидация статуса
	if !validProjectStatuses[project.Status] {
		return errors.New("invalid status")
	}

	return s.repo.Create(ctx, project)
}

func (s *ProjectService) GetProjectByID(ctx context.Context, id string) (*models.Project, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ProjectService) GetAllProjects(ctx context.Context) ([]models.Project, error) {
	return s.repo.GetAll(ctx)
}

func (s *ProjectService) UpdateProject(ctx context.Context, project *models.Project) error {
	// Валидация имени
	if strings.TrimSpace(project.Name) == "" {
		return errors.New("name is required")
	}

	// Валидация статуса
	if project.Status != "" && !validProjectStatuses[project.Status] {
		return errors.New("invalid status")
	}

	return s.repo.Update(ctx, project)
}

func (s *ProjectService) DeleteProject(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}
	return s.repo.Delete(ctx, id)
}
