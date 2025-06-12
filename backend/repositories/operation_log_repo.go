package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OperationLogRepository struct {
	db *pgxpool.Pool
}

func NewOperationLogRepository(db *pgxpool.Pool) *OperationLogRepository {
	return &OperationLogRepository{db: db}
}

func (r *OperationLogRepository) Create(ctx context.Context, log *models.OperationLog) error {
	query := `INSERT INTO operation_logs (task_id, user_identifier, operation_type, details) 
			  VALUES ($1, $2, $3, $4) 
			  RETURNING id, created_at`

	return r.db.QueryRow(ctx, query,
		log.TaskID,
		log.UserIdentifier,
		log.OperationType,
		log.Details,
	).Scan(&log.ID, &log.CreatedAt)
}

func (r *OperationLogRepository) GetByID(ctx context.Context, id string) (*models.OperationLog, error) {
	query := `SELECT id, task_id, user_identifier, operation_type, details, created_at 
			  FROM operation_logs WHERE id = $1`

	log := &models.OperationLog{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&log.ID,
		&log.TaskID,
		&log.UserIdentifier,
		&log.OperationType,
		&log.Details,
		&log.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return log, nil
}

func (r *OperationLogRepository) GetByTaskID(ctx context.Context, taskID string) ([]models.OperationLog, error) {
	query := `SELECT id, task_id, user_identifier, operation_type, details, created_at 
			  FROM operation_logs WHERE task_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.OperationLog
	for rows.Next() {
		var log models.OperationLog
		err := rows.Scan(
			&log.ID,
			&log.TaskID,
			&log.UserIdentifier,
			&log.OperationType,
			&log.Details,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

func (r *OperationLogRepository) GetAll(ctx context.Context) ([]models.OperationLog, error) {
	query := `SELECT id, task_id, user_identifier, operation_type, details, created_at 
			  FROM operation_logs ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.OperationLog
	for rows.Next() {
		var log models.OperationLog
		err := rows.Scan(
			&log.ID,
			&log.TaskID,
			&log.UserIdentifier,
			&log.OperationType,
			&log.Details,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

func (r *OperationLogRepository) GetByOperationType(ctx context.Context, operationType string) ([]models.OperationLog, error) {
	query := `SELECT id, task_id, user_identifier, operation_type, details, created_at 
			  FROM operation_logs WHERE operation_type = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, operationType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.OperationLog
	for rows.Next() {
		var log models.OperationLog
		err := rows.Scan(
			&log.ID,
			&log.TaskID,
			&log.UserIdentifier,
			&log.OperationType,
			&log.Details,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

func (r *OperationLogRepository) GetByUserIdentifier(ctx context.Context, userIdentifier string) ([]models.OperationLog, error) {
	query := `SELECT id, task_id, user_identifier, operation_type, details, created_at 
			  FROM operation_logs WHERE user_identifier = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, userIdentifier)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.OperationLog
	for rows.Next() {
		var log models.OperationLog
		err := rows.Scan(
			&log.ID,
			&log.TaskID,
			&log.UserIdentifier,
			&log.OperationType,
			&log.Details,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}
