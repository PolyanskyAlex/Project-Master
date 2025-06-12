package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"project-manager/models"
	"project-manager/services"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type FunctionalBlockHandler struct {
	service *services.FunctionalBlockService
}

func NewFunctionalBlockHandler(service *services.FunctionalBlockService) *FunctionalBlockHandler {
	return &FunctionalBlockHandler{service: service}
}

func (h *FunctionalBlockHandler) CreateFunctionalBlock(w http.ResponseWriter, r *http.Request) {
	var fb models.FunctionalBlock
	if err := json.NewDecoder(r.Body).Decode(&fb); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.CreateFunctionalBlock(r.Context(), &fb); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(fb)
}

func (h *FunctionalBlockHandler) GetFunctionalBlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	fb, err := h.service.GetFunctionalBlockByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if fb == nil {
		http.Error(w, "Functional block not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fb)
}

func (h *FunctionalBlockHandler) GetAllFunctionalBlocks(w http.ResponseWriter, r *http.Request) {
	blocks, err := h.service.GetAllFunctionalBlocks(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}

func (h *FunctionalBlockHandler) UpdateFunctionalBlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var fb models.FunctionalBlock
	if err := json.NewDecoder(r.Body).Decode(&fb); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	fb.ID = id // Устанавливаем ID из URL

	if err := h.service.UpdateFunctionalBlock(r.Context(), &fb); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Functional block not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fb)
}

func (h *FunctionalBlockHandler) DeleteFunctionalBlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.service.DeleteFunctionalBlock(r.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Functional block not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
