package services

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

var prefixRegex = regexp.MustCompile(`^[A-Z]{1,6}$`)

type FunctionalBlockService struct {
	repo *repositories.FunctionalBlockRepository
}

func NewFunctionalBlockService(repo *repositories.FunctionalBlockRepository) *FunctionalBlockService {
	return &FunctionalBlockService{repo: repo}
}

func (s *FunctionalBlockService) CreateFunctionalBlock(ctx context.Context, fb *models.FunctionalBlock) error {
	// Валидация имени
	if strings.TrimSpace(fb.Name) == "" {
		return errors.New("name is required")
	}

	// Валидация префикса
	if !prefixRegex.MatchString(fb.Prefix) {
		return errors.New("prefix must be 1-6 uppercase Latin letters")
	}

	// Проверка уникальности префикса
	existing, err := s.repo.GetByPrefix(ctx, fb.Prefix)
	if err != nil {
		return err
	}
	if existing != nil {
		return errors.New("prefix already exists")
	}

	return s.repo.Create(ctx, fb)
}

func (s *FunctionalBlockService) GetFunctionalBlockByID(ctx context.Context, id string) (*models.FunctionalBlock, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *FunctionalBlockService) GetAllFunctionalBlocks(ctx context.Context) ([]models.FunctionalBlock, error) {
	return s.repo.GetAll(ctx)
}

func (s *FunctionalBlockService) UpdateFunctionalBlock(ctx context.Context, fb *models.FunctionalBlock) error {
	// Валидация имени
	if strings.TrimSpace(fb.Name) == "" {
		return errors.New("name is required")
	}

	// Валидация префикса
	if !prefixRegex.MatchString(fb.Prefix) {
		return errors.New("prefix must be 1-6 uppercase Latin letters")
	}

	// Проверка уникальности префикса (исключая текущий блок)
	existing, err := s.repo.GetByPrefix(ctx, fb.Prefix)
	if err != nil {
		return err
	}
	if existing != nil && existing.ID != fb.ID {
		return errors.New("prefix already exists")
	}

	return s.repo.Update(ctx, fb)
}

func (s *FunctionalBlockService) DeleteFunctionalBlock(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}
	return s.repo.Delete(ctx, id)
}
