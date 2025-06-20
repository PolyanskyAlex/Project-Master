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

	// Определение порта с автоматическим поиском свободного
	preferredPort, err := utils.ParsePort(cfg.ServerPort)
	if err != nil {
		log.Printf("Ошибка парсинга порта: %v, используем порт по умолчанию 8080", err)
		preferredPort = 8080
	}

	actualPort, err := utils.FindAvailablePort(preferredPort)
	if err != nil {
		log.Fatalf("Не удалось найти свободный порт: %v", err)
	}

	// Если порт изменился, уведомляем пользователя
	if actualPort != preferredPort {
		fmt.Printf("⚠️  Порт %d занят, используем порт %d\n", preferredPort, actualPort)
	}

	// Записываем информацию о сервере для frontend
	if err := utils.WriteServerInfo(actualPort); err != nil {
		log.Printf("Предупреждение: не удалось записать информацию о сервере: %v", err)
	}

	// Настройка graceful shutdown
	setupGracefulShutdown()

	// Запуск HTTP-сервера
	address := fmt.Sprintf(":%d", actualPort)
	log.Printf("🚀 Server starting on port %d", actualPort)
	log.Printf("📡 API доступен по адресу: http://localhost:%d", actualPort)
	log.Printf("🔗 Health check: http://localhost:%d/health", actualPort)

	if err := http.ListenAndServe(address, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

// setupGracefulShutdown настраивает корректное завершение работы сервера
func setupGracefulShutdown() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		fmt.Println("\n🛑 Получен сигнал завершения, останавливаем сервер...")

		// Очищаем файл с информацией о сервере
		utils.CleanupServerInfo()

		fmt.Println("✅ Сервер остановлен")
		os.Exit(0)
	}()
}
