package main

import (
	"fmt"
	"path/filepath"

	"project-manager/config"
	"project-manager/database"
)

func main() {
	fmt.Println("Project Manager Backend")

	// Загрузка конфигурации
	cfg := config.LoadConfig()

	// Подключение к базе данных
	if cfg.DatabaseURL != "" {
		database.ConnectDB(cfg.DatabaseURL)

		// Применение миграций
		migrationsPath, _ := filepath.Abs("database/migrations")
		database.RunMigrations(cfg.DatabaseURL, migrationsPath)
	} else {
		fmt.Println("DATABASE_URL not set, skipping database connection")
	}

	fmt.Printf("Server will start on port %s\n", cfg.ServerPort)
}
