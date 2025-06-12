package main

import (
	"fmt"
	"log"
	"net/http"

	"project-manager/config"
	"project-manager/database"
	"project-manager/router"
)

func main() {
	fmt.Println("Project Manager Backend")

	// Загрузка конфигурации
	cfg := config.LoadConfig()

	// Подключение к базе данных (опционально)
	if cfg.DatabaseURL != "" {
		fmt.Println("Attempting to connect to database...")
		err := database.ConnectDB(cfg.DatabaseURL)
		if err != nil {
			fmt.Printf("Database connection failed: %v\n", err)
			fmt.Println("Continuing without database...")
		} else {
			// Применение миграций
			migrationsPath := "./database/migrations"
			err = database.RunMigrations(cfg.DatabaseURL, migrationsPath)
			if err != nil {
				fmt.Printf("Migration failed: %v\n", err)
				fmt.Println("Continuing without migrations...")
			}
		}
	} else {
		fmt.Println("DATABASE_URL not set, skipping database connection")
	}

	// Создание роутера
	r := router.NewRouter(cfg)

	// Запуск HTTP-сервера
	port := cfg.ServerPort
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
