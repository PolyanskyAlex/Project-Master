package router

import (
	"net/http"

	"project-manager/config"
	"project-manager/services"

	"github.com/go-chi/chi/v5"
)

func AuthMiddleware(authService *services.AuthService) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apiKey := r.Header.Get("X-API-Key")
			if !authService.IsAPIKeyValid(apiKey) {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func NewRouter(cfg *config.Config) *chi.Mux {
	r := chi.NewRouter()

	// Публичные маршруты
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Защищенные маршруты
	if cfg.APIKey != "" {
		authService := services.NewAuthService(cfg)
		r.Group(func(r chi.Router) {
			r.Use(AuthMiddleware(authService))

			// Тестовый защищенный эндпоинт
			r.Get("/api/test", func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("Protected endpoint"))
			})
		})
	}

	return r
}
