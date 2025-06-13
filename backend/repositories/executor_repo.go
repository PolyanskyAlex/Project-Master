package repositories

import (
	"context"
	"project-manager/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ExecutorRepository struct {
	db *pgxpool.Pool
}

func NewExecutorRepository(db *pgxpool.Pool) *ExecutorRepository {
	return &ExecutorRepository{db: db}
}

func (r *ExecutorRepository) GetAll(ctx context.Context) ([]models.Executor, error) {
	query := `SELECT id, name, created_at FROM executors ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executors []models.Executor
	for rows.Next() {
		var e models.Executor
		err := rows.Scan(&e.ID, &e.Name, &e.CreatedAt)
		if err != nil {
			return nil, err
		}
		executors = append(executors, e)
	}
	return executors, nil
}

func (r *ExecutorRepository) Create(ctx context.Context, name string) (*models.Executor, error) {
	query := `INSERT INTO executors (name) VALUES ($1) RETURNING id, name, created_at`
	var e models.Executor
	err := r.db.QueryRow(ctx, query, name).Scan(&e.ID, &e.Name, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}
