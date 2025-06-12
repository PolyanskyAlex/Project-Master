package router

import (
	"net/http"

	"project-manager/config"
	"project-manager/database"
	"project-manager/handlers"
	"project-manager/repositories"
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
	if cfg.APIKey != "" && database.DB != nil {
		authService := services.NewAuthService(cfg)

		// Инициализация репозиториев и сервисов
		fbRepo := repositories.NewFunctionalBlockRepository(database.DB)
		fbService := services.NewFunctionalBlockService(fbRepo)
		fbHandler := handlers.NewFunctionalBlockHandler(fbService)

		projectRepo := repositories.NewProjectRepository(database.DB)
		projectService := services.NewProjectService(projectRepo)
		projectHandler := handlers.NewProjectHandler(projectService)

		r.Group(func(r chi.Router) {
			r.Use(AuthMiddleware(authService))

			// API v1 маршруты
			r.Route("/api/v1", func(r chi.Router) {
				// Функциональные блоки
				r.Route("/functional-blocks", func(r chi.Router) {
					r.Get("/", fbHandler.GetAllFunctionalBlocks)
					r.Post("/", fbHandler.CreateFunctionalBlock)
					r.Get("/{id}", fbHandler.GetFunctionalBlock)
					r.Put("/{id}", fbHandler.UpdateFunctionalBlock)
					r.Delete("/{id}", fbHandler.DeleteFunctionalBlock)
				})

				// Проекты
				r.Route("/projects", func(r chi.Router) {
					r.Get("/", projectHandler.GetAllProjects)
					r.Post("/", projectHandler.CreateProject)
					r.Get("/{id}", projectHandler.GetProject)
					r.Put("/{id}", projectHandler.UpdateProject)
					r.Delete("/{id}", projectHandler.DeleteProject)
				})
			})

			// Тестовый защищенный эндпоинт
			r.Get("/api/test", func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("Protected endpoint"))
			})
		})
	}

	return r
}
