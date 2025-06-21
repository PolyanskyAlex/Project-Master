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

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Cache-Control")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

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

	// Добавляем middleware
	r.Use(LoggingMiddleware) // Логирование HTTP запросов
	r.Use(corsMiddleware)    // CORS

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

		taskRepo := repositories.NewTaskRepository(database.DB)

		logRepo := repositories.NewOperationLogRepository(database.DB)
		logService := services.NewOperationLogService(logRepo, taskRepo)
		logHandler := handlers.NewOperationLogHandler(logService)

		commentRepo := repositories.NewCommentRepository(database.DB)
		commentService := services.NewCommentService(commentRepo, taskRepo, logService)
		commentHandler := handlers.NewCommentHandler(commentService)

		taskService := services.NewTaskService(taskRepo, projectRepo, fbRepo, logService)
		taskHandler := handlers.NewTaskHandler(taskService)

		documentRepo := repositories.NewDocumentRepository(database.DB)
		documentService := services.NewDocumentService(documentRepo, projectRepo)
		documentHandler := handlers.NewDocumentHandler(documentService)

		planRepo := repositories.NewProjectPlanRepository(database.DB)
		planService := services.NewProjectPlanService(planRepo, projectRepo, taskRepo)
		planHandler := handlers.NewProjectPlanHandler(planService)

		executorRepo := repositories.NewExecutorRepository(database.DB)
		executorService := services.NewExecutorService(executorRepo)
		executorHandler := handlers.NewExecutorHandler(executorService)

		frontendLogHandler := handlers.NewFrontendLogHandler()

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

					// План разработки проекта
					r.Route("/{projectID}/plan", func(r chi.Router) {
						r.Get("/", planHandler.GetProjectPlan)
						r.Get("/stats", planHandler.GetProjectPlanStats)
						r.Put("/reorder", planHandler.ReorderTasks)

						// Управление задачами в плане
						r.Route("/tasks", func(r chi.Router) {
							r.Post("/batch", planHandler.AddMultipleTasksToPlan)
							r.Delete("/batch", planHandler.RemoveMultipleTasksFromPlan)

							r.Route("/{taskID}", func(r chi.Router) {
								r.Post("/", planHandler.AddTaskToPlan)
								r.Delete("/", planHandler.RemoveTaskFromPlan)
								r.Get("/check", planHandler.IsTaskInPlan)
								r.Get("/position", planHandler.GetTaskPosition)
								r.Put("/position", planHandler.MoveTaskToPosition)
							})
						})
					})
				})

				// Задачи
				r.Route("/tasks", func(r chi.Router) {
					r.Get("/", taskHandler.GetAllTasks)
					r.Post("/", taskHandler.CreateTask)
					r.Get("/by-status", taskHandler.GetTasksByStatus)
					r.Get("/statuses", taskHandler.GetValidStatuses)
					r.Get("/priorities", taskHandler.GetValidPriorities)
					r.Get("/types", taskHandler.GetValidTypes)
					r.Get("/number/{number}", taskHandler.GetTaskByNumber)
					r.Get("/project/{projectId}", taskHandler.GetTasksByProject)
					r.Get("/functional-block/{functionalBlockId}", taskHandler.GetTasksByFunctionalBlock)
					r.Get("/{id}", taskHandler.GetTask)
					r.Put("/{id}", taskHandler.UpdateTask)
					r.Delete("/{id}", taskHandler.DeleteTask)
				})

				// Комментарии
				r.Route("/comments", func(r chi.Router) {
					r.Get("/", commentHandler.GetAllComments)
					r.Post("/", commentHandler.CreateComment)
					r.Get("/task/{taskId}", commentHandler.GetCommentsByTask)
					r.Get("/{id}", commentHandler.GetComment)
					r.Delete("/{id}", commentHandler.DeleteComment)
				})

				// Логи операций
				r.Route("/operation-logs", func(r chi.Router) {
					r.Get("/", logHandler.GetAllLogs)
					r.Get("/by-type", logHandler.GetLogsByOperationType)
					r.Get("/by-user", logHandler.GetLogsByUser)
					r.Get("/operation-types", logHandler.GetValidOperationTypes)
					r.Get("/task/{taskId}", logHandler.GetLogsByTask)
					r.Get("/{id}", logHandler.GetLog)
				})

				// Документы
				r.Route("/documents", func(r chi.Router) {
					r.Get("/", documentHandler.GetAllDocuments)
					r.Post("/", documentHandler.CreateDocument)
					r.Get("/by-type", documentHandler.GetDocumentsByType)
					r.Get("/document-types", documentHandler.GetValidDocumentTypes)
					r.Get("/project/{projectId}", documentHandler.GetDocumentsByProject)
					r.Get("/project/{projectId}/agent-editable", documentHandler.GetAgentEditableDocumentsByProject)
					r.Get("/project/{projectId}/type/{type}", documentHandler.GetDocumentsByProjectAndType)
					r.Get("/{id}", documentHandler.GetDocument)
					r.Put("/{id}", documentHandler.UpdateDocument)
					r.Delete("/{id}", documentHandler.DeleteDocument)
				})

				// Исполнители
				// /api/v1/executors
				r.Route("/executors", func(r chi.Router) {
					r.Get("/", executorHandler.GetAllExecutors)
					r.Post("/", executorHandler.CreateExecutor)
				})

				// Frontend логи
				r.Route("/frontend-logs", func(r chi.Router) {
					r.Post("/", frontendLogHandler.SaveFrontendLogs)
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
