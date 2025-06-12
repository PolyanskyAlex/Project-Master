package repositories

import (
	"context"
	"errors"
	"fmt"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepository struct {
	db *pgxpool.Pool
}

func NewTaskRepository(db *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{db: db}
}

// generateTaskNumber генерирует уникальный номер задачи
func (r *TaskRepository) generateTaskNumber(ctx context.Context) (string, error) {
	var nextNumber int64
	query := `UPDATE task_number_sequence SET current_value = current_value + 1 WHERE id = 1 RETURNING current_value`
	err := r.db.QueryRow(ctx, query).Scan(&nextNumber)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("TASK-%06d", nextNumber), nil
}

func (r *TaskRepository) Create(ctx context.Context, task *models.Task) error {
	// Генерируем номер задачи
	number, err := r.generateTaskNumber(ctx)
	if err != nil {
		return fmt.Errorf("failed to generate task number: %w", err)
	}
	task.Number = number

	query := `INSERT INTO tasks (project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
			  RETURNING id, created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		task.ProjectID,
		task.FunctionalBlockID,
		task.Number,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.Type,
		task.Role,
		task.Result,
		task.ParentTaskID,
	).Scan(&task.ID, &task.CreatedAt, &task.UpdatedAt)
}

func (r *TaskRepository) GetByID(ctx context.Context, id string) (*models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks WHERE id = $1`

	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&task.ID,
		&task.ProjectID,
		&task.FunctionalBlockID,
		&task.Number,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.Type,
		&task.Role,
		&task.Result,
		&task.ParentTaskID,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return task, nil
}

func (r *TaskRepository) GetByNumber(ctx context.Context, number string) (*models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks WHERE number = $1`

	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, number).Scan(
		&task.ID,
		&task.ProjectID,
		&task.FunctionalBlockID,
		&task.Number,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.Type,
		&task.Role,
		&task.Result,
		&task.ParentTaskID,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return task, nil
}

func (r *TaskRepository) GetAll(ctx context.Context) ([]models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.ProjectID,
			&task.FunctionalBlockID,
			&task.Number,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.Type,
			&task.Role,
			&task.Result,
			&task.ParentTaskID,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *TaskRepository) GetByProjectID(ctx context.Context, projectID string) ([]models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.ProjectID,
			&task.FunctionalBlockID,
			&task.Number,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.Type,
			&task.Role,
			&task.Result,
			&task.ParentTaskID,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *TaskRepository) Update(ctx context.Context, task *models.Task) error {
	query := `UPDATE tasks SET 
			  functional_block_id = $1, 
			  title = $2, 
			  description = $3, 
			  status = $4, 
			  priority = $5, 
			  type = $6, 
			  role = $7, 
			  result = $8, 
			  parent_task_id = $9, 
			  updated_at = CURRENT_TIMESTAMP 
			  WHERE id = $10 
			  RETURNING updated_at`

	return r.db.QueryRow(ctx, query,
		task.FunctionalBlockID,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.Type,
		task.Role,
		task.Result,
		task.ParentTaskID,
		task.ID,
	).Scan(&task.UpdatedAt)
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM tasks WHERE id = $1`
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *TaskRepository) GetByStatus(ctx context.Context, status string) ([]models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks WHERE status = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.ProjectID,
			&task.FunctionalBlockID,
			&task.Number,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.Type,
			&task.Role,
			&task.Result,
			&task.ParentTaskID,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *TaskRepository) GetByFunctionalBlockID(ctx context.Context, functionalBlockID string) ([]models.Task, error) {
	query := `SELECT id, project_id, functional_block_id, number, title, description, status, priority, type, role, result, parent_task_id, created_at, updated_at 
			  FROM tasks WHERE functional_block_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, functionalBlockID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.ProjectID,
			&task.FunctionalBlockID,
			&task.Number,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.Type,
			&task.Role,
			&task.Result,
			&task.ParentTaskID,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}
