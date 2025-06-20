package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// ServerInfo содержит информацию о запущенном сервере
type ServerInfo struct {
	Port      int    `json:"port"`
	BaseURL   string `json:"baseURL"`
	Status    string `json:"status"`
	StartTime string `json:"startTime"`
	PID       int    `json:"pid"`
}

// WriteServerInfo записывает информацию о сервере в файл
func WriteServerInfo(port int) error {
	info := ServerInfo{
		Port:      port,
		BaseURL:   fmt.Sprintf("http://localhost:%d", port),
		Status:    "running",
		StartTime: fmt.Sprintf("%d", os.Getpid()), // временно используем PID
		PID:       os.Getpid(),
	}

	// Создаем директорию если её нет
	dir := filepath.Join("..", "frontend", "public")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("не удалось создать директорию %s: %v", dir, err)
	}

	// Записываем в файл
	filePath := filepath.Join(dir, "server-info.json")
	data, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		return fmt.Errorf("не удалось сериализовать данные сервера: %v", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("не удалось записать файл %s: %v", filePath, err)
	}

	fmt.Printf("Информация о сервере записана в %s\n", filePath)
	return nil
}

// CleanupServerInfo удаляет файл с информацией о сервере
func CleanupServerInfo() {
	filePath := filepath.Join("..", "frontend", "public", "server-info.json")
	if err := os.Remove(filePath); err != nil {
		// Игнорируем ошибку если файл не существует
		if !os.IsNotExist(err) {
			fmt.Printf("Предупреждение: не удалось удалить %s: %v\n", filePath, err)
		}
	}
}
