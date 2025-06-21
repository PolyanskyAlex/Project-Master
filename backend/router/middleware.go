package router

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"project-manager/utils"
)

// responseWriter wrapper для захвата ответа
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
		body:           &bytes.Buffer{},
	}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	rw.body.Write(b)
	return rw.ResponseWriter.Write(b)
}

// LoggingMiddleware логирует все HTTP запросы
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Читаем тело запроса
		var requestBody []byte
		if r.Body != nil {
			requestBody, _ = io.ReadAll(r.Body)
			r.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Оборачиваем ResponseWriter
		wrapped := newResponseWriter(w)

		// Выполняем запрос
		next.ServeHTTP(wrapped, r)

		// Вычисляем время выполнения
		duration := time.Since(start)

		// Подготавливаем данные для лога
		logData := map[string]interface{}{
			"method":       r.Method,
			"url":          r.URL.String(),
			"remote_addr":  r.RemoteAddr,
			"user_agent":   r.UserAgent(),
			"status_code":  wrapped.statusCode,
			"duration_ms":  duration.Milliseconds(),
			"content_type": r.Header.Get("Content-Type"),
		}

		// Добавляем тело запроса для POST/PUT запросов
		if len(requestBody) > 0 && (r.Method == "POST" || r.Method == "PUT") {
			if isJSON(r.Header.Get("Content-Type")) {
				var jsonBody interface{}
				if err := json.Unmarshal(requestBody, &jsonBody); err == nil {
					logData["request_body"] = jsonBody
				} else {
					logData["request_body"] = string(requestBody)
				}
			}
		}

		// Добавляем тело ответа для ошибок
		if wrapped.statusCode >= 400 {
			responseBody := wrapped.body.String()
			if responseBody != "" {
				logData["response_body"] = responseBody
			}
		}

		// Определяем уровень логирования
		var message string
		switch {
		case wrapped.statusCode >= 500:
			message = "HTTP Request - Server Error"
			utils.Error(message, logData)
		case wrapped.statusCode >= 400:
			message = "HTTP Request - Client Error"
			utils.Warn(message, logData)
		case wrapped.statusCode >= 300:
			message = "HTTP Request - Redirect"
			utils.Info(message, logData)
		default:
			message = "HTTP Request - Success"
			utils.Info(message, logData)
		}
	})
}

// isJSON проверяет, является ли content-type JSON
func isJSON(contentType string) bool {
	return contentType == "application/json" ||
		contentType == "application/json; charset=utf-8"
}
