package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectRepository struct {
	db *pgxpool.Pool
}

func NewProjectRepository(db *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(ctx context.Context, project *models.Project) error {
	query := `INSERT INTO projects (name, description, status) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(ctx, query, project.Name, project.Description, project.Status).Scan(&project.ID, &project.CreatedAt, &project.UpdatedAt)
}

func (r *ProjectRepository) GetByID(ctx context.Context, id string) (*models.Project, error) {
	query := `SELECT id, name, description, status, created_at, updated_at FROM projects WHERE id = $1`
	project := &models.Project{}
	err := r.db.QueryRow(ctx, query, id).Scan(&project.ID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return project, nil
}

func (r *ProjectRepository) GetAll(ctx context.Context) ([]models.Project, error) {
	query := `SELECT id, name, description, status, created_at, updated_at FROM projects ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var project models.Project
		err := rows.Scan(&project.ID, &project.Name, &project.Description, &project.Status, &project.CreatedAt, &project.UpdatedAt)
		if err != nil {
			return nil, err
		}
		projects = append(projects, project)
	}
	return projects, nil
}

func (r *ProjectRepository) Update(ctx context.Context, project *models.Project) error {
	query := `UPDATE projects SET name = $1, description = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING updated_at`
	return r.db.QueryRow(ctx, query, project.Name, project.Description, project.Status, project.ID).Scan(&project.UpdatedAt)
}

func (r *ProjectRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM projects WHERE id = $1`
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
