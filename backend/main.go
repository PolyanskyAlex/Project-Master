package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"project-manager/config"
	"project-manager/database"
	"project-manager/router"
	"project-manager/utils"
)

func main() {
	fmt.Println("Project Manager Backend")

	// Инициализация логгера
	logDir := "./logs"
	if os.Getenv("LOG_DIR") != "" {
		logDir = os.Getenv("LOG_DIR")
	}

	// В Docker контейнере логи пишутся в /var/log/app
	if _, err := os.Stat("/var/log/app"); err == nil {
		logDir = "/var/log/app"
	}

	logLevel := utils.INFO
	if os.Getenv("DEBUG") == "true" || os.Getenv("ENV") == "development" {
		logLevel = utils.DEBUG
	}

	if err := utils.InitLogger(logDir, logLevel); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}

	utils.Info("Application starting", map[string]interface{}{
		"log_dir":   logDir,
		"log_level": logLevel.String(),
	})

	// Загрузка конфигурации
	cfg := config.LoadConfig()

	// Подключение к базе данных (опционально)
	if cfg.DatabaseURL != "" {
		utils.Info("Attempting to connect to database", map[string]interface{}{
			"database_url": cfg.DatabaseURL,
		})
		err := database.ConnectDB(cfg.DatabaseURL)
		if err != nil {
			utils.Error("Database connection failed", map[string]interface{}{
				"error": err.Error(),
			})
			utils.Warn("Continuing without database")
		} else {
			utils.Info("Database connected successfully")

			// Применение миграций
			migrationsPath := "./database/migrations"
			utils.Info("Running database migrations", map[string]interface{}{
				"migrations_path": migrationsPath,
			})
			err = database.RunMigrations(cfg.DatabaseURL, migrationsPath)
			if err != nil {
				utils.Error("Migration failed", map[string]interface{}{
					"error": err.Error(),
				})
				utils.Warn("Continuing without migrations")
			} else {
				utils.Info("Database migrations completed successfully")
			}
		}
	} else {
		utils.Warn("DATABASE_URL not set, skipping database connection")
	}

	// Создание роутера
	r := router.NewRouter(cfg)

	// Определение порта с автоматическим поиском свободного
	preferredPort, err := utils.ParsePort(cfg.ServerPort)
	if err != nil {
		utils.Warn("Port parsing error, using default port 8080", map[string]interface{}{
			"error":        err.Error(),
			"config_port":  cfg.ServerPort,
			"default_port": 8080,
		})
		preferredPort = 8080
	}

	actualPort, err := utils.FindAvailablePort(preferredPort)
	if err != nil {
		utils.Fatal("Failed to find available port", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Если порт изменился, уведомляем пользователя
	if actualPort != preferredPort {
		utils.Warn("Preferred port is busy, using alternative port", map[string]interface{}{
			"preferred_port": preferredPort,
			"actual_port":    actualPort,
		})
	}

	// Записываем информацию о сервере для frontend
	if err := utils.WriteServerInfo(actualPort); err != nil {
		utils.Warn("Failed to write server info", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Настройка graceful shutdown
	setupGracefulShutdown()

	// Запуск HTTP-сервера
	address := fmt.Sprintf(":%d", actualPort)

	utils.Info("🚀 Server starting", map[string]interface{}{
		"port":       actualPort,
		"address":    address,
		"api_url":    fmt.Sprintf("http://localhost:%d", actualPort),
		"health_url": fmt.Sprintf("http://localhost:%d/health", actualPort),
	})

	if err := http.ListenAndServe(address, r); err != nil {
		utils.Fatal("Server startup failed", map[string]interface{}{
			"error": err.Error(),
		})
	}
}

// setupGracefulShutdown настраивает корректное завершение работы сервера
func setupGracefulShutdown() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		utils.Info("🛑 Shutdown signal received, stopping server")

		// Очищаем файл с информацией о сервере
		utils.CleanupServerInfo()

		utils.Info("✅ Server stopped gracefully")
		os.Exit(0)
	}()
}
