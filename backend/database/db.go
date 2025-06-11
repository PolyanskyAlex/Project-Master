package database

import (
	"context"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB(databaseURL string) error {
	var err error
	DB, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %v", err)
	}

	err = DB.Ping(context.Background())
	if err != nil {
		return fmt.Errorf("cannot ping database: %v", err)
	}

	log.Println("Connected to database!")
	return nil
}

func RunMigrations(databaseURL, migrationsPath string) error {
	m, err := migrate.New(fmt.Sprintf("file://%s", migrationsPath), databaseURL)
	if err != nil {
		return fmt.Errorf("error creating migrate instance: %v", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("error running migrations: %v", err)
	}

	log.Println("Database migrations applied!")
	return nil
}
