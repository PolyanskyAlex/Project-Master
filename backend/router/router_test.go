package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"project-manager/config"

	"github.com/stretchr/testify/assert"
)

func TestCORSMiddleware_AllowsCacheControlHeader(t *testing.T) {
	// Создаем тестовую конфигурацию
	cfg := &config.Config{
		APIKey: "test-key",
	}

	// Создаем роутер
	router := NewRouter(cfg)

	// Создаем OPTIONS запрос (preflight) с Cache-Control заголовком
	req := httptest.NewRequest("OPTIONS", "/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	req.Header.Set("Access-Control-Request-Headers", "cache-control")

	// Создаем ResponseRecorder для записи ответа
	rr := httptest.NewRecorder()

	// Выполняем запрос
	router.ServeHTTP(rr, req)

	// Проверяем статус код
	assert.Equal(t, http.StatusOK, rr.Code, "OPTIONS preflight request should return 200")

	// Проверяем CORS заголовки
	assert.Equal(t, "http://localhost:3000", rr.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, DELETE, OPTIONS", rr.Header().Get("Access-Control-Allow-Methods"))

	// Главная проверка: Cache-Control должен быть в разрешенных заголовках
	allowedHeaders := rr.Header().Get("Access-Control-Allow-Headers")
	assert.Contains(t, allowedHeaders, "Cache-Control", "Cache-Control header should be allowed in CORS")
	assert.Contains(t, allowedHeaders, "Content-Type", "Content-Type header should be allowed in CORS")
	assert.Contains(t, allowedHeaders, "X-API-Key", "X-API-Key header should be allowed in CORS")
}

func TestCORSMiddleware_AllowsActualHealthRequest(t *testing.T) {
	// Создаем тестовую конфигурацию
	cfg := &config.Config{
		APIKey: "test-key",
	}

	// Создаем роутер
	router := NewRouter(cfg)

	// Создаем GET запрос к /health с Cache-Control заголовком
	req := httptest.NewRequest("GET", "/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Cache-Control", "no-cache")

	// Создаем ResponseRecorder для записи ответа
	rr := httptest.NewRecorder()

	// Выполняем запрос
	router.ServeHTTP(rr, req)

	// Проверяем статус код
	assert.Equal(t, http.StatusOK, rr.Code, "GET /health request should return 200")

	// Проверяем CORS заголовки в ответе
	assert.Equal(t, "http://localhost:3000", rr.Header().Get("Access-Control-Allow-Origin"))

	// Проверяем тело ответа
	assert.Equal(t, "OK", rr.Body.String())
}
