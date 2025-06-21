package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// LogLevel определяет уровни логирования
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// String возвращает строковое представление уровня
func (l LogLevel) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// LogEntry представляет запись в логе
type LogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Source    string                 `json:"source,omitempty"`
	File      string                 `json:"file,omitempty"`
	Line      int                    `json:"line,omitempty"`
}

// Logger структура для логирования
type Logger struct {
	level      LogLevel
	logDir     string
	fileWriter io.Writer
	consoleLog *log.Logger
	fileLog    *log.Logger
}

var GlobalLogger *Logger

// InitLogger инициализирует глобальный логгер
func InitLogger(logDir string, level LogLevel) error {
	logger, err := NewLogger(logDir, level)
	if err != nil {
		return err
	}
	GlobalLogger = logger
	return nil
}

// NewLogger создает новый логгер
func NewLogger(logDir string, level LogLevel) (*Logger, error) {
	// Создаем директорию для логов
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %w", err)
	}

	// Создаем файл лога с датой
	logFileName := fmt.Sprintf("app-%s.log", time.Now().Format("2006-01-02"))
	logFilePath := filepath.Join(logDir, logFileName)

	logFile, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	// Создаем мультиплексер для записи в файл и консоль
	multiWriter := io.MultiWriter(os.Stdout, logFile)

	logger := &Logger{
		level:      level,
		logDir:     logDir,
		fileWriter: logFile,
		consoleLog: log.New(os.Stdout, "", 0),
		fileLog:    log.New(multiWriter, "", 0),
	}

	// Очищаем старые логи (старше 7 дней)
	go logger.cleanOldLogs()

	return logger, nil
}

// cleanOldLogs удаляет логи старше 7 дней
func (l *Logger) cleanOldLogs() {
	files, err := os.ReadDir(l.logDir)
	if err != nil {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -7) // 7 дней назад

	for _, file := range files {
		if strings.HasPrefix(file.Name(), "app-") && strings.HasSuffix(file.Name(), ".log") {
			info, err := file.Info()
			if err != nil {
				continue
			}

			if info.ModTime().Before(cutoff) {
				os.Remove(filepath.Join(l.logDir, file.Name()))
			}
		}
	}
}

// getCallerInfo получает информацию о месте вызова
func (l *Logger) getCallerInfo() (string, int) {
	_, file, line, ok := runtime.Caller(3)
	if !ok {
		return "unknown", 0
	}
	return filepath.Base(file), line
}

// log записывает лог
func (l *Logger) log(level LogLevel, message string, data map[string]interface{}) {
	if level < l.level {
		return
	}

	file, line := l.getCallerInfo()

	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     level.String(),
		Message:   message,
		Data:      data,
		File:      file,
		Line:      line,
	}

	// JSON формат для файла
	jsonData, err := json.Marshal(entry)
	if err != nil {
		jsonData = []byte(fmt.Sprintf(`{"timestamp":"%s","level":"%s","message":"JSON marshal error: %s","file":"%s","line":%d}`,
			entry.Timestamp.Format(time.RFC3339), entry.Level, err.Error(), entry.File, entry.Line))
	}

	// Записываем в файл
	l.fileLog.Println(string(jsonData))

	// Красивый вывод в консоль
	consoleMsg := fmt.Sprintf("[%s] %s %s:%d - %s",
		entry.Timestamp.Format("15:04:05"),
		entry.Level,
		entry.File,
		entry.Line,
		entry.Message)

	if len(data) > 0 {
		dataStr, _ := json.Marshal(data)
		consoleMsg += fmt.Sprintf(" | %s", string(dataStr))
	}

	l.consoleLog.Println(consoleMsg)
}

// Debug логирует отладочную информацию
func (l *Logger) Debug(message string, data ...map[string]interface{}) {
	var logData map[string]interface{}
	if len(data) > 0 {
		logData = data[0]
	}
	l.log(DEBUG, message, logData)
}

// Info логирует информационные сообщения
func (l *Logger) Info(message string, data ...map[string]interface{}) {
	var logData map[string]interface{}
	if len(data) > 0 {
		logData = data[0]
	}
	l.log(INFO, message, logData)
}

// Warn логирует предупреждения
func (l *Logger) Warn(message string, data ...map[string]interface{}) {
	var logData map[string]interface{}
	if len(data) > 0 {
		logData = data[0]
	}
	l.log(WARN, message, logData)
}

// Error логирует ошибки
func (l *Logger) Error(message string, data ...map[string]interface{}) {
	var logData map[string]interface{}
	if len(data) > 0 {
		logData = data[0]
	}
	l.log(ERROR, message, logData)
}

// Fatal логирует критические ошибки и завершает программу
func (l *Logger) Fatal(message string, data ...map[string]interface{}) {
	var logData map[string]interface{}
	if len(data) > 0 {
		logData = data[0]
	}
	l.log(FATAL, message, logData)
	os.Exit(1)
}

// Глобальные функции для удобства
func Debug(message string, data ...map[string]interface{}) {
	if GlobalLogger != nil {
		GlobalLogger.Debug(message, data...)
	}
}

func Info(message string, data ...map[string]interface{}) {
	if GlobalLogger != nil {
		GlobalLogger.Info(message, data...)
	}
}

func Warn(message string, data ...map[string]interface{}) {
	if GlobalLogger != nil {
		GlobalLogger.Warn(message, data...)
	}
}

func Error(message string, data ...map[string]interface{}) {
	if GlobalLogger != nil {
		GlobalLogger.Error(message, data...)
	}
}

func Fatal(message string, data ...map[string]interface{}) {
	if GlobalLogger != nil {
		GlobalLogger.Fatal(message, data...)
	}
}
