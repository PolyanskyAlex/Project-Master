package handlers

import (
	"net/http"
	"strconv"
	"time"

	"project-master/internal/models"
	"project-master/internal/services"

	"github.com/gin-gonic/gin"
)

type TaskExecutionHandler struct {
	taskService      *services.TaskService
	executionService *services.TaskExecutionService
}

type ExecuteTaskRequest struct {
	Command   string `json:"command" binding:"required"`
	Source    string `json:"source"` // "web", "vscode", "api"
	UserID    string `json:"user_id"`
	ProjectID *uint  `json:"project_id,omitempty"`
}

type ExecutionStatusResponse struct {
	ID            string                 `json:"id"`
	Status        string                 `json:"status"`
	Progress      int                    `json:"progress"`
	Message       string                 `json:"message"`
	TaskID        *uint                  `json:"task_id,omitempty"`
	TaskTitle     string                 `json:"task_title"`
	Strategy      string                 `json:"strategy"`
	StartTime     time.Time              `json:"start_time"`
	EndTime       *time.Time             `json:"end_time,omitempty"`
	ExecutionTime *int64                 `json:"execution_time,omitempty"` // milliseconds
	Error         string                 `json:"error,omitempty"`
	Steps         []ExecutionStepStatus  `json:"steps"`
	Logs          []string               `json:"logs"`
	Result        map[string]interface{} `json:"result,omitempty"`
}

type ExecutionStepStatus struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Status      string     `json:"status"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     *time.Time `json:"end_time,omitempty"`
	Error       string     `json:"error,omitempty"`
	Description string     `json:"description"`
}

func NewTaskExecutionHandler(taskService *services.TaskService, executionService *services.TaskExecutionService) *TaskExecutionHandler {
	return &TaskExecutionHandler{
		taskService:      taskService,
		executionService: executionService,
	}
}

// POST /api/v1/tasks/execute
func (h *TaskExecutionHandler) ExecuteTask(c *gin.Context) {
	var req ExecuteTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Валидация команды
	if len(req.Command) == 0 || len(req.Command) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Command must be between 1 and 500 characters",
		})
		return
	}

	// Создание контекста выполнения
	executionContext := &services.ExecutionContext{
		Command:   req.Command,
		Source:    req.Source,
		UserID:    req.UserID,
		ProjectID: req.ProjectID,
		StartTime: time.Now(),
	}

	// Запуск выполнения задачи
	executionID, err := h.executionService.StartExecution(executionContext)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to start task execution",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"execution_id": executionID,
		"status":       "started",
		"message":      "Task execution started successfully",
	})
}

// GET /api/v1/tasks/execute/:execution_id/status
func (h *TaskExecutionHandler) GetExecutionStatus(c *gin.Context) {
	executionID := c.Param("execution_id")
	if executionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Execution ID is required",
		})
		return
	}

	status, err := h.executionService.GetExecutionStatus(executionID)
	if err != nil {
		if err == services.ErrExecutionNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Execution not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get execution status",
			"details": err.Error(),
		})
		return
	}

	response := h.mapExecutionStatusToResponse(status)
	c.JSON(http.StatusOK, response)
}

// GET /api/v1/tasks/execute/history
func (h *TaskExecutionHandler) GetExecutionHistory(c *gin.Context) {
	userID := c.Query("user_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	history, total, err := h.executionService.GetExecutionHistory(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get execution history",
			"details": err.Error(),
		})
		return
	}

	var responses []ExecutionStatusResponse
	for _, execution := range history {
		responses = append(responses, h.mapExecutionStatusToResponse(execution))
	}

	c.JSON(http.StatusOK, gin.H{
		"executions": responses,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// POST /api/v1/tasks/execute/:execution_id/cancel
func (h *TaskExecutionHandler) CancelExecution(c *gin.Context) {
	executionID := c.Param("execution_id")
	if executionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Execution ID is required",
		})
		return
	}

	err := h.executionService.CancelExecution(executionID)
	if err != nil {
		if err == services.ErrExecutionNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Execution not found",
			})
			return
		}
		if err == services.ErrExecutionNotCancellable {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Execution cannot be cancelled in current state",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to cancel execution",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Execution cancelled successfully",
	})
}

// GET /api/v1/tasks/execute/metrics
func (h *TaskExecutionHandler) GetExecutionMetrics(c *gin.Context) {
	userID := c.Query("user_id")
	daysStr := c.DefaultQuery("days", "30")

	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 || days > 365 {
		days = 30
	}

	metrics, err := h.executionService.GetExecutionMetrics(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get execution metrics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// GET /api/v1/tasks/:task_id/execute-button
func (h *TaskExecutionHandler) GetTaskExecuteButton(c *gin.Context) {
	taskIDStr := c.Param("task_id")
	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	// Получение информации о задаче
	task, err := h.taskService.GetTask(uint(taskID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	// Проверка, можно ли выполнить задачу
	canExecute := task.Status == "todo" || task.Status == "in_progress"

	// Получение активных выполнений для этой задачи
	activeExecutions, _ := h.executionService.GetActiveExecutionsForTask(uint(taskID))

	response := gin.H{
		"task_id":           task.ID,
		"task_title":        task.Title,
		"can_execute":       canExecute,
		"execution_command": "Выполнить задачу " + strconv.Itoa(int(task.ID)),
		"active_executions": len(activeExecutions),
		"button_config": gin.H{
			"enabled": canExecute && len(activeExecutions) == 0,
			"text":    getExecuteButtonText(task, activeExecutions),
			"variant": getExecuteButtonVariant(task, activeExecutions),
			"icon":    getExecuteButtonIcon(task, activeExecutions),
			"tooltip": getExecuteButtonTooltip(task, activeExecutions),
		},
	}

	c.JSON(http.StatusOK, response)
}

func (h *TaskExecutionHandler) mapExecutionStatusToResponse(status *services.ExecutionStatus) ExecutionStatusResponse {
	response := ExecutionStatusResponse{
		ID:        status.ID,
		Status:    status.Status,
		Progress:  status.Progress,
		Message:   status.Message,
		TaskTitle: status.TaskTitle,
		Strategy:  status.Strategy,
		StartTime: status.StartTime,
		EndTime:   status.EndTime,
		Error:     status.Error,
		Logs:      status.Logs,
		Result:    status.Result,
	}

	if status.TaskID != nil {
		response.TaskID = status.TaskID
	}

	if status.EndTime != nil {
		executionTime := status.EndTime.Sub(status.StartTime).Milliseconds()
		response.ExecutionTime = &executionTime
	}

	for _, step := range status.Steps {
		response.Steps = append(response.Steps, ExecutionStepStatus{
			ID:          step.ID,
			Name:        step.Name,
			Status:      step.Status,
			StartTime:   step.StartTime,
			EndTime:     step.EndTime,
			Error:       step.Error,
			Description: step.Description,
		})
	}

	return response
}

func getExecuteButtonText(task *models.Task, activeExecutions []*services.ExecutionStatus) string {
	if len(activeExecutions) > 0 {
		return "Выполняется..."
	}

	switch task.Status {
	case "todo":
		return "Выполнить задачу"
	case "in_progress":
		return "Продолжить выполнение"
	case "done":
		return "Переопределить"
	default:
		return "Выполнить"
	}
}

func getExecuteButtonVariant(task *models.Task, activeExecutions []*services.ExecutionStatus) string {
	if len(activeExecutions) > 0 {
		return "secondary"
	}

	switch task.Priority {
	case "critical":
		return "danger"
	case "high":
		return "warning"
	default:
		return "primary"
	}
}

func getExecuteButtonIcon(task *models.Task, activeExecutions []*services.ExecutionStatus) string {
	if len(activeExecutions) > 0 {
		return "loading"
	}

	switch task.Type {
	case "bug":
		return "bug"
	case "feature":
		return "plus"
	case "test":
		return "check"
	default:
		return "play"
	}
}

func getExecuteButtonTooltip(task *models.Task, activeExecutions []*services.ExecutionStatus) string {
	if len(activeExecutions) > 0 {
		return "Задача уже выполняется"
	}

	if task.Status == "done" {
		return "Задача уже выполнена. Нажмите для переопределения."
	}

	return "Запустить автоматическое выполнение задачи"
}
