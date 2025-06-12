package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CommentRepository struct {
	db *pgxpool.Pool
}

func NewCommentRepository(db *pgxpool.Pool) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(ctx context.Context, comment *models.Comment) error {
	query := `INSERT INTO comments (task_id, user_identifier, content) 
			  VALUES ($1, $2, $3) 
			  RETURNING id, created_at`

	return r.db.QueryRow(ctx, query,
		comment.TaskID,
		comment.UserIdentifier,
		comment.Content,
	).Scan(&comment.ID, &comment.CreatedAt)
}

func (r *CommentRepository) GetByID(ctx context.Context, id string) (*models.Comment, error) {
	query := `SELECT id, task_id, user_identifier, content, created_at 
			  FROM comments WHERE id = $1`

	comment := &models.Comment{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&comment.ID,
		&comment.TaskID,
		&comment.UserIdentifier,
		&comment.Content,
		&comment.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return comment, nil
}

func (r *CommentRepository) GetByTaskID(ctx context.Context, taskID string) ([]models.Comment, error) {
	query := `SELECT id, task_id, user_identifier, content, created_at 
			  FROM comments WHERE task_id = $1 ORDER BY created_at ASC`

	rows, err := r.db.Query(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		err := rows.Scan(
			&comment.ID,
			&comment.TaskID,
			&comment.UserIdentifier,
			&comment.Content,
			&comment.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func (r *CommentRepository) GetAll(ctx context.Context) ([]models.Comment, error) {
	query := `SELECT id, task_id, user_identifier, content, created_at 
			  FROM comments ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		err := rows.Scan(
			&comment.ID,
			&comment.TaskID,
			&comment.UserIdentifier,
			&comment.Content,
			&comment.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func (r *CommentRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM comments WHERE id = $1`
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
