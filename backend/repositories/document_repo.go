package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DocumentRepository struct {
	db *pgxpool.Pool
}

func NewDocumentRepository(db *pgxpool.Pool) *DocumentRepository {
	return &DocumentRepository{db: db}
}

func (r *DocumentRepository) Create(ctx context.Context, document *models.Document) error {
	query := `INSERT INTO documents (project_id, type, title, content, agent_editable) 
			  VALUES ($1, $2, $3, $4, $5) 
			  RETURNING id, created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		document.ProjectID,
		document.Type,
		document.Title,
		document.Content,
		document.AgentEditable,
	).Scan(&document.ID, &document.CreatedAt, &document.UpdatedAt)
}

func (r *DocumentRepository) GetByID(ctx context.Context, id string) (*models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents WHERE id = $1`

	document := &models.Document{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&document.ID,
		&document.ProjectID,
		&document.Type,
		&document.Title,
		&document.Content,
		&document.AgentEditable,
		&document.CreatedAt,
		&document.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return document, nil
}

func (r *DocumentRepository) GetAll(ctx context.Context) ([]models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.ProjectID,
			&document.Type,
			&document.Title,
			&document.Content,
			&document.AgentEditable,
			&document.CreatedAt,
			&document.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, nil
}

func (r *DocumentRepository) GetByProjectID(ctx context.Context, projectID string) ([]models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents WHERE project_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.ProjectID,
			&document.Type,
			&document.Title,
			&document.Content,
			&document.AgentEditable,
			&document.CreatedAt,
			&document.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, nil
}

func (r *DocumentRepository) GetByType(ctx context.Context, docType string) ([]models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents WHERE type = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, docType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.ProjectID,
			&document.Type,
			&document.Title,
			&document.Content,
			&document.AgentEditable,
			&document.CreatedAt,
			&document.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, nil
}

func (r *DocumentRepository) GetByProjectIDAndType(ctx context.Context, projectID, docType string) ([]models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents WHERE project_id = $1 AND type = $2 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, projectID, docType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.ProjectID,
			&document.Type,
			&document.Title,
			&document.Content,
			&document.AgentEditable,
			&document.CreatedAt,
			&document.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, nil
}

func (r *DocumentRepository) GetAgentEditableByProjectID(ctx context.Context, projectID string) ([]models.Document, error) {
	query := `SELECT id, project_id, type, title, content, agent_editable, created_at, updated_at 
			  FROM documents WHERE project_id = $1 AND agent_editable = true ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.ProjectID,
			&document.Type,
			&document.Title,
			&document.Content,
			&document.AgentEditable,
			&document.CreatedAt,
			&document.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, nil
}

func (r *DocumentRepository) Update(ctx context.Context, document *models.Document) error {
	query := `UPDATE documents SET 
			  type = $1, 
			  title = $2, 
			  content = $3, 
			  agent_editable = $4, 
			  updated_at = CURRENT_TIMESTAMP 
			  WHERE id = $5 
			  RETURNING updated_at`

	return r.db.QueryRow(ctx, query,
		document.Type,
		document.Title,
		document.Content,
		document.AgentEditable,
		document.ID,
	).Scan(&document.UpdatedAt)
}

func (r *DocumentRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM documents WHERE id = $1`
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
