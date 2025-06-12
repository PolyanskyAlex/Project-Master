package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"project-manager/models"
	"project-manager/services"
	"project-manager/utils"
)

type ProjectPlanHandler struct {
	service *services.ProjectPlanService
}

func NewProjectPlanHandler(service *services.ProjectPlanService) *ProjectPlanHandler {
	return &ProjectPlanHandler{
		service: service,
	}
}

// AddTaskToPlan добавляет задачу в план проекта
// POST /api/v1/projects/{projectID}/plan/tasks/{taskID}
func (h *ProjectPlanHandler) AddTaskToPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")

	if err := h.service.AddTaskToPlan(r.Context(), projectID, taskID); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusCreated, map[string]string{
		"message": "Task added to project plan successfully",
	})
}

// RemoveTaskFromPlan удаляет задачу из плана проекта
// DELETE /api/v1/projects/{projectID}/plan/tasks/{taskID}
func (h *ProjectPlanHandler) RemoveTaskFromPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")

	if err := h.service.RemoveTaskFromPlan(r.Context(), projectID, taskID); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Task removed from project plan successfully",
	})
}

// GetProjectPlan получает план проекта
// GET /api/v1/projects/{projectID}/plan
func (h *ProjectPlanHandler) GetProjectPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	plan, err := h.service.GetProjectPlan(r.Context(), projectID)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, plan)
}

// ReorderTasks изменяет порядок задач в плане
// PUT /api/v1/projects/{projectID}/plan/reorder
func (h *ProjectPlanHandler) ReorderTasks(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	var reorderRequest models.ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&reorderRequest); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if err := h.service.ReorderTasks(r.Context(), projectID, &reorderRequest); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Tasks reordered successfully",
	})
}

// MoveTaskToPosition перемещает задачу на определенную позицию
// PUT /api/v1/projects/{projectID}/plan/tasks/{taskID}/position
func (h *ProjectPlanHandler) MoveTaskToPosition(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")

	var request struct {
		Position int `json:"position"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if err := h.service.MoveTaskToPosition(r.Context(), projectID, taskID, request.Position); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Task moved to new position successfully",
	})
}

// GetTaskPosition получает позицию задачи в плане
// GET /api/v1/projects/{projectID}/plan/tasks/{taskID}/position
func (h *ProjectPlanHandler) GetTaskPosition(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")

	position, err := h.service.GetTaskPosition(r.Context(), projectID, taskID)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id":  taskID,
		"position": position,
	})
}

// IsTaskInPlan проверяет, находится ли задача в плане проекта
// GET /api/v1/projects/{projectID}/plan/tasks/{taskID}/check
func (h *ProjectPlanHandler) IsTaskInPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")

	inPlan, err := h.service.IsTaskInPlan(r.Context(), projectID, taskID)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSONResponse(w, http.StatusOK, map[string]interface{}{
		"task_id": taskID,
		"in_plan": inPlan,
	})
}

// AddMultipleTasksToPlan добавляет несколько задач в план проекта
// POST /api/v1/projects/{projectID}/plan/tasks/batch
func (h *ProjectPlanHandler) AddMultipleTasksToPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	var request struct {
		TaskIDs []string `json:"task_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if len(request.TaskIDs) == 0 {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "task_ids are required")
		return
	}

	var errors []string
	var successCount int

	for _, taskID := range request.TaskIDs {
		if err := h.service.AddTaskToPlan(r.Context(), projectID, taskID); err != nil {
			errors = append(errors, "Task "+taskID+": "+err.Error())
		} else {
			successCount++
		}
	}

	response := map[string]interface{}{
		"total_tasks":   len(request.TaskIDs),
		"success_count": successCount,
		"failed_count":  len(errors),
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	statusCode := http.StatusOK
	if successCount == 0 {
		statusCode = http.StatusBadRequest
	} else if len(errors) > 0 {
		statusCode = http.StatusPartialContent
	}

	utils.WriteJSONResponse(w, statusCode, response)
}

// RemoveMultipleTasksFromPlan удаляет несколько задач из плана проекта
// DELETE /api/v1/projects/{projectID}/plan/tasks/batch
func (h *ProjectPlanHandler) RemoveMultipleTasksFromPlan(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	var request struct {
		TaskIDs []string `json:"task_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if len(request.TaskIDs) == 0 {
		utils.WriteErrorResponse(w, http.StatusBadRequest, "task_ids are required")
		return
	}

	var errors []string
	var successCount int

	for _, taskID := range request.TaskIDs {
		if err := h.service.RemoveTaskFromPlan(r.Context(), projectID, taskID); err != nil {
			errors = append(errors, "Task "+taskID+": "+err.Error())
		} else {
			successCount++
		}
	}

	response := map[string]interface{}{
		"total_tasks":   len(request.TaskIDs),
		"success_count": successCount,
		"failed_count":  len(errors),
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	statusCode := http.StatusOK
	if successCount == 0 {
		statusCode = http.StatusBadRequest
	} else if len(errors) > 0 {
		statusCode = http.StatusPartialContent
	}

	utils.WriteJSONResponse(w, statusCode, response)
}

// GetProjectPlanStats получает статистику плана проекта
// GET /api/v1/projects/{projectID}/plan/stats
func (h *ProjectPlanHandler) GetProjectPlanStats(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	plan, err := h.service.GetProjectPlan(r.Context(), projectID)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	stats := map[string]interface{}{
		"project_id":  plan.ProjectID,
		"total_tasks": len(plan.Items),
		"task_count":  len(plan.Items),
	}

	// Подсчет статистики по статусам задач
	statusCounts := make(map[string]int)
	priorityCounts := make(map[string]int)
	typeCounts := make(map[string]int)

	for _, item := range plan.Items {
		statusCounts[item.TaskStatus]++
		priorityCounts[item.TaskPriority]++
		typeCounts[item.TaskType]++
	}

	stats["status_distribution"] = statusCounts
	stats["priority_distribution"] = priorityCounts
	stats["type_distribution"] = typeCounts

	utils.WriteJSONResponse(w, http.StatusOK, stats)
}
