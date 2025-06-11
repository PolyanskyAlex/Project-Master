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
	// Попробуем загрузить .env из текущей папки, затем из родительской
	err := godotenv.Load()
	if err != nil {
		err = godotenv.Load("../.env")
		if err != nil {
			log.Println("No .env file found, relying on environment variables")
		}
	}

	return &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		ServerPort:  os.Getenv("SERVER_PORT"),
		APIKey:      os.Getenv("API_KEY"),
	}
}
