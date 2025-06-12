package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectPlanRepository struct {
	db *pgxpool.Pool
}

func NewProjectPlanRepository(db *pgxpool.Pool) *ProjectPlanRepository {
	return &ProjectPlanRepository{db: db}
}

// AddTaskToPlan добавляет задачу в план проекта
func (r *ProjectPlanRepository) AddTaskToPlan(ctx context.Context, projectID, taskID string) error {
	// Получаем следующий порядковый номер
	var nextOrder int
	orderQuery := `SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM project_plan_sequences WHERE project_id = $1`
	err := r.db.QueryRow(ctx, orderQuery, projectID).Scan(&nextOrder)
	if err != nil {
		return err
	}

	// Добавляем задачу в план
	query := `INSERT INTO project_plan_sequences (project_id, task_id, sequence_order) 
			  VALUES ($1, $2, $3) 
			  RETURNING id, created_at, updated_at`

	var sequence models.ProjectPlanSequence
	return r.db.QueryRow(ctx, query, projectID, taskID, nextOrder).Scan(
		&sequence.ID, &sequence.CreatedAt, &sequence.UpdatedAt)
}

// RemoveTaskFromPlan удаляет задачу из плана проекта
func (r *ProjectPlanRepository) RemoveTaskFromPlan(ctx context.Context, projectID, taskID string) error {
	// Получаем порядковый номер удаляемой задачи
	var removedOrder int
	orderQuery := `SELECT sequence_order FROM project_plan_sequences WHERE project_id = $1 AND task_id = $2`
	err := r.db.QueryRow(ctx, orderQuery, projectID, taskID).Scan(&removedOrder)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("task not found in project plan")
		}
		return err
	}

	// Начинаем транзакцию
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Удаляем задачу из плана
	deleteQuery := `DELETE FROM project_plan_sequences WHERE project_id = $1 AND task_id = $2`
	_, err = tx.Exec(ctx, deleteQuery, projectID, taskID)
	if err != nil {
		return err
	}

	// Обновляем порядковые номера для задач, которые были после удаленной
	updateQuery := `UPDATE project_plan_sequences 
					SET sequence_order = sequence_order - 1, updated_at = CURRENT_TIMESTAMP 
					WHERE project_id = $1 AND sequence_order > $2`
	_, err = tx.Exec(ctx, updateQuery, projectID, removedOrder)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// GetProjectPlan получает план проекта с информацией о задачах
func (r *ProjectPlanRepository) GetProjectPlan(ctx context.Context, projectID string) (*models.ProjectPlan, error) {
	query := `SELECT 
				pps.id, pps.project_id, pps.task_id, pps.sequence_order, pps.created_at, pps.updated_at,
				t.number, t.title, t.description, t.status, t.priority, t.type
			  FROM project_plan_sequences pps
			  JOIN tasks t ON pps.task_id = t.id
			  WHERE pps.project_id = $1
			  ORDER BY pps.sequence_order ASC`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ProjectPlanItem
	for rows.Next() {
		var item models.ProjectPlanItem
		err := rows.Scan(
			&item.ID,
			&item.ProjectID,
			&item.TaskID,
			&item.SequenceOrder,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.TaskNumber,
			&item.TaskTitle,
			&item.TaskDescription,
			&item.TaskStatus,
			&item.TaskPriority,
			&item.TaskType,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return &models.ProjectPlan{
		ProjectID: projectID,
		Items:     items,
	}, nil
}

// ReorderTasks изменяет порядок задач в плане проекта
func (r *ProjectPlanRepository) ReorderTasks(ctx context.Context, projectID string, taskSequences []models.TaskSequence) error {
	// Начинаем транзакцию
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Обновляем порядок для каждой задачи
	updateQuery := `UPDATE project_plan_sequences 
					SET sequence_order = $1, updated_at = CURRENT_TIMESTAMP 
					WHERE project_id = $2 AND task_id = $3`

	for _, taskSeq := range taskSequences {
		_, err = tx.Exec(ctx, updateQuery, taskSeq.SequenceOrder, projectID, taskSeq.TaskID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// IsTaskInPlan проверяет, находится ли задача в плане проекта
func (r *ProjectPlanRepository) IsTaskInPlan(ctx context.Context, projectID, taskID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM project_plan_sequences WHERE project_id = $1 AND task_id = $2)`
	var exists bool
	err := r.db.QueryRow(ctx, query, projectID, taskID).Scan(&exists)
	return exists, err
}

// GetTaskPosition получает позицию задачи в плане проекта
func (r *ProjectPlanRepository) GetTaskPosition(ctx context.Context, projectID, taskID string) (int, error) {
	query := `SELECT sequence_order FROM project_plan_sequences WHERE project_id = $1 AND task_id = $2`
	var position int
	err := r.db.QueryRow(ctx, query, projectID, taskID).Scan(&position)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, errors.New("task not found in project plan")
		}
		return 0, err
	}
	return position, nil
}

// MoveTaskToPosition перемещает задачу на определенную позицию в плане
func (r *ProjectPlanRepository) MoveTaskToPosition(ctx context.Context, projectID, taskID string, newPosition int) error {
	// Начинаем транзакцию
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Получаем текущую позицию задачи
	var currentPosition int
	posQuery := `SELECT sequence_order FROM project_plan_sequences WHERE project_id = $1 AND task_id = $2`
	err = tx.QueryRow(ctx, posQuery, projectID, taskID).Scan(&currentPosition)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("task not found in project plan")
		}
		return err
	}

	if currentPosition == newPosition {
		return tx.Commit(ctx) // Позиция не изменилась
	}

	// Сдвигаем задачи в зависимости от направления перемещения
	if currentPosition < newPosition {
		// Перемещение вниз - сдвигаем задачи вверх
		shiftQuery := `UPDATE project_plan_sequences 
					   SET sequence_order = sequence_order - 1, updated_at = CURRENT_TIMESTAMP 
					   WHERE project_id = $1 AND sequence_order > $2 AND sequence_order <= $3`
		_, err = tx.Exec(ctx, shiftQuery, projectID, currentPosition, newPosition)
	} else {
		// Перемещение вверх - сдвигаем задачи вниз
		shiftQuery := `UPDATE project_plan_sequences 
					   SET sequence_order = sequence_order + 1, updated_at = CURRENT_TIMESTAMP 
					   WHERE project_id = $1 AND sequence_order >= $2 AND sequence_order < $3`
		_, err = tx.Exec(ctx, shiftQuery, projectID, newPosition, currentPosition)
	}
	if err != nil {
		return err
	}

	// Устанавливаем новую позицию для перемещаемой задачи
	updateQuery := `UPDATE project_plan_sequences 
					SET sequence_order = $1, updated_at = CURRENT_TIMESTAMP 
					WHERE project_id = $2 AND task_id = $3`
	_, err = tx.Exec(ctx, updateQuery, newPosition, projectID, taskID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
