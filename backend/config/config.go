package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	ServerPort  string
	APIKey      string
}

func LoadConfig() *Config {
	// Приоритет загрузки конфигурации:
	// 1. .env.local (для локальной разработки)
	// 2. .env (для Docker и production)
	// 3. Переменные окружения

	// Попробуем загрузить .env.local из текущей папки, затем из родительской
	err := godotenv.Load(".env.local")
	if err != nil {
		err = godotenv.Load("../.env.local")
		if err != nil {
			// Если .env.local не найден, пробуем обычный .env
			err = godotenv.Load()
			if err != nil {
				err = godotenv.Load("../.env")
				if err != nil {
					log.Println("No .env or .env.local file found, relying on environment variables")
				}
			}
		}
	}

	return &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		ServerPort:  os.Getenv("SERVER_PORT"),
		APIKey:      os.Getenv("API_KEY"),
	}
}
