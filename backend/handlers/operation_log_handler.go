package handlers

import (
	"encoding/json"
	"net/http"

	"project-manager/services"

	"github.com/go-chi/chi/v5"
)

type OperationLogHandler struct {
	service *services.OperationLogService
}

func NewOperationLogHandler(service *services.OperationLogService) *OperationLogHandler {
	return &OperationLogHandler{service: service}
}

func (h *OperationLogHandler) GetLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	log, err := h.service.GetLogByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if log == nil {
		http.Error(w, "Operation log not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(log)
}

func (h *OperationLogHandler) GetLogsByTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")

	logs, err := h.service.GetLogsByTaskID(r.Context(), taskID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *OperationLogHandler) GetAllLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := h.service.GetAllLogs(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *OperationLogHandler) GetLogsByOperationType(w http.ResponseWriter, r *http.Request) {
	operationType := r.URL.Query().Get("type")
	if operationType == "" {
		http.Error(w, "type parameter is required", http.StatusBadRequest)
		return
	}

	logs, err := h.service.GetLogsByOperationType(r.Context(), operationType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *OperationLogHandler) GetLogsByUser(w http.ResponseWriter, r *http.Request) {
	userIdentifier := r.URL.Query().Get("user")
	if userIdentifier == "" {
		http.Error(w, "user parameter is required", http.StatusBadRequest)
		return
	}

	logs, err := h.service.GetLogsByUserIdentifier(r.Context(), userIdentifier)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

// GetValidOperationTypes возвращает список валидных типов операций
func (h *OperationLogHandler) GetValidOperationTypes(w http.ResponseWriter, r *http.Request) {
	types := h.service.GetValidOperationTypes()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]string{"operationTypes": types})
}
