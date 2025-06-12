package repositories

import (
	"context"
	"errors"

	"project-manager/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FunctionalBlockRepository struct {
	db *pgxpool.Pool
}

func NewFunctionalBlockRepository(db *pgxpool.Pool) *FunctionalBlockRepository {
	return &FunctionalBlockRepository{db: db}
}

func (r *FunctionalBlockRepository) Create(ctx context.Context, fb *models.FunctionalBlock) error {
	query := `INSERT INTO functional_blocks (name, prefix) VALUES ($1, $2) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(ctx, query, fb.Name, fb.Prefix).Scan(&fb.ID, &fb.CreatedAt, &fb.UpdatedAt)
}

func (r *FunctionalBlockRepository) GetByID(ctx context.Context, id string) (*models.FunctionalBlock, error) {
	query := `SELECT id, name, prefix, created_at, updated_at FROM functional_blocks WHERE id = $1`
	fb := &models.FunctionalBlock{}
	err := r.db.QueryRow(ctx, query, id).Scan(&fb.ID, &fb.Name, &fb.Prefix, &fb.CreatedAt, &fb.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return fb, nil
}

func (r *FunctionalBlockRepository) GetByPrefix(ctx context.Context, prefix string) (*models.FunctionalBlock, error) {
	query := `SELECT id, name, prefix, created_at, updated_at FROM functional_blocks WHERE prefix = $1`
	fb := &models.FunctionalBlock{}
	err := r.db.QueryRow(ctx, query, prefix).Scan(&fb.ID, &fb.Name, &fb.Prefix, &fb.CreatedAt, &fb.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return fb, nil
}

func (r *FunctionalBlockRepository) GetAll(ctx context.Context) ([]models.FunctionalBlock, error) {
	query := `SELECT id, name, prefix, created_at, updated_at FROM functional_blocks ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.FunctionalBlock
	for rows.Next() {
		var fb models.FunctionalBlock
		err := rows.Scan(&fb.ID, &fb.Name, &fb.Prefix, &fb.CreatedAt, &fb.UpdatedAt)
		if err != nil {
			return nil, err
		}
		blocks = append(blocks, fb)
	}
	return blocks, nil
}

func (r *FunctionalBlockRepository) Update(ctx context.Context, fb *models.FunctionalBlock) error {
	query := `UPDATE functional_blocks SET name = $1, prefix = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING updated_at`
	return r.db.QueryRow(ctx, query, fb.Name, fb.Prefix, fb.ID).Scan(&fb.UpdatedAt)
}

func (r *FunctionalBlockRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM functional_blocks WHERE id = $1`
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
