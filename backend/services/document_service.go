package services

import (
	"context"
	"errors"
	"strings"

	"project-manager/models"
	"project-manager/repositories"
)

type DocumentService struct {
	documentRepo *repositories.DocumentRepository
	projectRepo  *repositories.ProjectRepository
}

func NewDocumentService(documentRepo *repositories.DocumentRepository, projectRepo *repositories.ProjectRepository) *DocumentService {
	return &DocumentService{
		documentRepo: documentRepo,
		projectRepo:  projectRepo,
	}
}

func (s *DocumentService) CreateDocument(ctx context.Context, document *models.Document) error {
	// Валидация обязательных полей
	if strings.TrimSpace(document.ProjectID) == "" {
		return errors.New("project_id is required")
	}

	if strings.TrimSpace(document.Type) == "" {
		return errors.New("type is required")
	}

	if strings.TrimSpace(document.Title) == "" {
		return errors.New("title is required")
	}

	if strings.TrimSpace(document.Content) == "" {
		return errors.New("content is required")
	}

	// Валидация типа документа
	if !models.IsValidDocumentType(document.Type) {
		return errors.New("invalid document type")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, document.ProjectID)
	if err != nil {
		return err
	}
	if project == nil {
		return errors.New("project not found")
	}

	return s.documentRepo.Create(ctx, document)
}

func (s *DocumentService) GetDocumentByID(ctx context.Context, id string) (*models.Document, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.documentRepo.GetByID(ctx, id)
}

func (s *DocumentService) GetAllDocuments(ctx context.Context) ([]models.Document, error) {
	return s.documentRepo.GetAll(ctx)
}

func (s *DocumentService) GetDocumentsByProjectID(ctx context.Context, projectID string) ([]models.Document, error) {
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

	return s.documentRepo.GetByProjectID(ctx, projectID)
}

func (s *DocumentService) GetDocumentsByType(ctx context.Context, docType string) ([]models.Document, error) {
	if strings.TrimSpace(docType) == "" {
		return nil, errors.New("type is required")
	}

	// Валидация типа документа
	if !models.IsValidDocumentType(docType) {
		return nil, errors.New("invalid document type")
	}

	return s.documentRepo.GetByType(ctx, docType)
}

func (s *DocumentService) GetDocumentsByProjectIDAndType(ctx context.Context, projectID, docType string) ([]models.Document, error) {
	if strings.TrimSpace(projectID) == "" {
		return nil, errors.New("project_id is required")
	}

	if strings.TrimSpace(docType) == "" {
		return nil, errors.New("type is required")
	}

	// Валидация типа документа
	if !models.IsValidDocumentType(docType) {
		return nil, errors.New("invalid document type")
	}

	// Проверка существования проекта
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return s.documentRepo.GetByProjectIDAndType(ctx, projectID, docType)
}

func (s *DocumentService) GetAgentEditableDocumentsByProjectID(ctx context.Context, projectID string) ([]models.Document, error) {
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

	return s.documentRepo.GetAgentEditableByProjectID(ctx, projectID)
}

func (s *DocumentService) UpdateDocument(ctx context.Context, document *models.Document) error {
	// Валидация обязательных полей
	if strings.TrimSpace(document.ID) == "" {
		return errors.New("id is required")
	}

	if strings.TrimSpace(document.Type) == "" {
		return errors.New("type is required")
	}

	if strings.TrimSpace(document.Title) == "" {
		return errors.New("title is required")
	}

	if strings.TrimSpace(document.Content) == "" {
		return errors.New("content is required")
	}

	// Валидация типа документа
	if !models.IsValidDocumentType(document.Type) {
		return errors.New("invalid document type")
	}

	// Проверка существования документа
	existingDocument, err := s.documentRepo.GetByID(ctx, document.ID)
	if err != nil {
		return err
	}
	if existingDocument == nil {
		return errors.New("document not found")
	}

	// Сохраняем неизменяемые поля
	document.ProjectID = existingDocument.ProjectID
	document.CreatedAt = existingDocument.CreatedAt

	return s.documentRepo.Update(ctx, document)
}

func (s *DocumentService) DeleteDocument(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}

	// Проверка существования документа
	document, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if document == nil {
		return errors.New("document not found")
	}

	return s.documentRepo.Delete(ctx, id)
}

// GetValidDocumentTypes возвращает список валидных типов документов
func (s *DocumentService) GetValidDocumentTypes() []string {
	return models.ValidDocumentTypes()
}
