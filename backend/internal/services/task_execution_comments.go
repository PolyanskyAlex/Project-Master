package services

import (
	"fmt"
	"project-master/internal/models"
	"time"
)

type TaskExecutionCommentService struct {
	commentService *CommentService
	taskService    *TaskService
}

func NewTaskExecutionCommentService(commentService *CommentService, taskService *TaskService) *TaskExecutionCommentService {
	return &TaskExecutionCommentService{
		commentService: commentService,
		taskService:    taskService,
	}
}

// AddExecutionStartComment добавляет комментарий о начале выполнения задачи
func (s *TaskExecutionCommentService) AddExecutionStartComment(taskID uint, executionID string, strategy string) error {
	comment := &models.Comment{
		TaskID:    taskID,
		Author:    "AI-Agent",
		Content:   fmt.Sprintf("🤖 Начато автоматическое выполнение задачи\n\n**ID выполнения:** %s\n**Стратегия:** %s\n**Время начала:** %s", executionID, strategy, time.Now().Format("15:04:05")),
		Type:      "system",
		CreatedAt: time.Now(),
	}

	return s.commentService.CreateComment(comment)
}

// AddExecutionProgressComment добавляет комментарий о прогрессе выполнения
func (s *TaskExecutionCommentService) AddExecutionProgressComment(taskID uint, executionID string, step string, progress int) error {
	comment := &models.Comment{
		TaskID:    taskID,
		Author:    "AI-Agent",
		Content:   fmt.Sprintf("⚙️ Прогресс выполнения: %d%%\n\n**Текущий этап:** %s\n**ID выполнения:** %s", progress, step, executionID),
		Type:      "system",
		CreatedAt: time.Now(),
	}

	return s.commentService.CreateComment(comment)
}

// AddExecutionCompleteComment добавляет комментарий о завершении выполнения
func (s *TaskExecutionCommentService) AddExecutionCompleteComment(taskID uint, executionID string, success bool, executionTime int64, result string) error {
	var icon, status string
	if success {
		icon = "✅"
		status = "успешно завершено"
	} else {
		icon = "❌"
		status = "завершено с ошибкой"
	}

	content := fmt.Sprintf("%s Выполнение задачи %s\n\n**ID выполнения:** %s\n**Время выполнения:** %d мс\n**Результат:** %s",
		icon, status, executionID, executionTime, result)

	comment := &models.Comment{
		TaskID:    taskID,
		Author:    "AI-Agent",
		Content:   content,
		Type:      "system",
		CreatedAt: time.Now(),
	}

	return s.commentService.CreateComment(comment)
}

// AddExecutionErrorComment добавляет комментарий об ошибке выполнения
func (s *TaskExecutionCommentService) AddExecutionErrorComment(taskID uint, executionID string, errorMsg string) error {
	comment := &models.Comment{
		TaskID:    taskID,
		Author:    "AI-Agent",
		Content:   fmt.Sprintf("⚠️ Ошибка при выполнении задачи\n\n**ID выполнения:** %s\n**Ошибка:** %s\n**Время:** %s", executionID, errorMsg, time.Now().Format("15:04:05")),
		Type:      "system",
		CreatedAt: time.Now(),
	}

	return s.commentService.CreateComment(comment)
}
