package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"project-manager/utils"
)

type FrontendLogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     int                    `json:"level"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Source    string                 `json:"source,omitempty"`
}

type FrontendLogRequest struct {
	Timestamp string             `json:"timestamp"`
	Logs      []FrontendLogEntry `json:"logs"`
	UserAgent string             `json:"userAgent"`
	URL       string             `json:"url"`
}

type FrontendLogHandler struct{}

func NewFrontendLogHandler() *FrontendLogHandler {
	return &FrontendLogHandler{}
}

func (h *FrontendLogHandler) SaveFrontendLogs(w http.ResponseWriter, r *http.Request) {
	var req FrontendLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error("Failed to decode frontend logs request", map[string]interface{}{
			"error": err.Error(),
		})
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Определяем директорию для frontend логов
	logDir := "./logs/frontend"
	if _, err := os.Stat("/var/log/app"); err == nil {
		logDir = "/var/log/app/frontend"
	}

	// Создаем директорию если её нет
	if err := os.MkdirAll(logDir, 0755); err != nil {
		utils.Error("Failed to create frontend logs directory", map[string]interface{}{
			"error": err.Error(),
			"dir":   logDir,
		})
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Создаем имя файла с датой и временем
	timestamp := time.Now()
	fileName := fmt.Sprintf("frontend-%s.log", timestamp.Format("2006-01-02"))
	filePath := filepath.Join(logDir, fileName)

	// Открываем файл для добавления
	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		utils.Error("Failed to open frontend log file", map[string]interface{}{
			"error": err.Error(),
			"file":  filePath,
		})
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// Записываем метаданные сессии
	sessionInfo := map[string]interface{}{
		"session_start": req.Timestamp,
		"user_agent":    req.UserAgent,
		"url":           req.URL,
		"logs_count":    len(req.Logs),
		"saved_at":      timestamp.Format(time.RFC3339),
	}

	sessionLine := map[string]interface{}{
		"timestamp": timestamp.Format(time.RFC3339),
		"level":     "INFO",
		"message":   "Frontend logs session",
		"data":      sessionInfo,
		"source":    "FrontendLogHandler",
	}

	sessionJSON, _ := json.Marshal(sessionLine)
	file.WriteString(string(sessionJSON) + "\n")

	// Записываем каждый лог
	for _, logEntry := range req.Logs {
		// Преобразуем в формат backend логов
		backendLogEntry := map[string]interface{}{
			"timestamp": logEntry.Timestamp.Format(time.RFC3339),
			"level":     getLevelName(logEntry.Level),
			"message":   logEntry.Message,
			"data":      logEntry.Data,
			"source":    fmt.Sprintf("Frontend-%s", logEntry.Source),
		}

		logJSON, err := json.Marshal(backendLogEntry)
		if err != nil {
			utils.Warn("Failed to marshal frontend log entry", map[string]interface{}{
				"error": err.Error(),
				"entry": logEntry,
			})
			continue
		}

		file.WriteString(string(logJSON) + "\n")
	}

	utils.Info("Frontend logs saved successfully", map[string]interface{}{
		"file":       filePath,
		"logs_count": len(req.Logs),
		"user_agent": req.UserAgent,
		"url":        req.URL,
	})

	// Отправляем успешный ответ
	response := map[string]interface{}{
		"success":    true,
		"message":    "Logs saved successfully",
		"file":       fileName,
		"logs_count": len(req.Logs),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getLevelName преобразует числовой уровень в строку
func getLevelName(level int) string {
	switch level {
	case 0:
		return "DEBUG"
	case 1:
		return "INFO"
	case 2:
		return "WARN"
	case 3:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}
