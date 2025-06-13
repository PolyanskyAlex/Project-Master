package handlers

import (
	"encoding/json"
	"net/http"
	"project-manager/services"
)

type ExecutorHandler struct {
	service *services.ExecutorService
}

func NewExecutorHandler(service *services.ExecutorService) *ExecutorHandler {
	return &ExecutorHandler{service: service}
}

func (h *ExecutorHandler) GetAllExecutors(w http.ResponseWriter, r *http.Request) {
	executors, err := h.service.GetAllExecutors(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(executors)
}

func (h *ExecutorHandler) CreateExecutor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "Invalid JSON or empty name", http.StatusBadRequest)
		return
	}
	executor, err := h.service.CreateExecutor(r.Context(), req.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(executor)
}
