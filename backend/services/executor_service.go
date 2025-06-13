package services

import (
	"context"
	"project-manager/models"
	"project-manager/repositories"
)

type ExecutorService struct {
	repo *repositories.ExecutorRepository
}

func NewExecutorService(repo *repositories.ExecutorRepository) *ExecutorService {
	return &ExecutorService{repo: repo}
}

func (s *ExecutorService) GetAllExecutors(ctx context.Context) ([]models.Executor, error) {
	return s.repo.GetAll(ctx)
}

func (s *ExecutorService) CreateExecutor(ctx context.Context, name string) (*models.Executor, error) {
	return s.repo.Create(ctx, name)
}
