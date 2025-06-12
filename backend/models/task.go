package models

import (
	"time"
)

type Task struct {
	ID                string    `json:"id" db:"id"`
	ProjectID         string    `json:"projectId" db:"project_id"`
	FunctionalBlockID *string   `json:"functionalBlockId" db:"functional_block_id"`
	Number            string    `json:"number" db:"number"`
	Title             string    `json:"title" db:"title"`
	Description       string    `json:"description" db:"description"`
	Status            string    `json:"status" db:"status"`
	Priority          string    `json:"priority" db:"priority"`
	Type              string    `json:"type" db:"type"`
	Role              string    `json:"role" db:"role"`
	Result            string    `json:"result" db:"result"`
	ParentTaskID      *string   `json:"parentTaskId" db:"parent_task_id"`
	CreatedAt         time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time `json:"updatedAt" db:"updated_at"`
}

// TaskStatus определяет возможные статусы задач
type TaskStatus string

const (
	TaskStatusNew        TaskStatus = "Новая"
	TaskStatusInProgress TaskStatus = "В работе"
	TaskStatusTesting    TaskStatus = "Тестирование"
	TaskStatusDone       TaskStatus = "Выполнена"
	TaskStatusCancelled  TaskStatus = "Отменена"
)

// TaskPriority определяет возможные приоритеты задач
type TaskPriority string

const (
	TaskPriorityLow      TaskPriority = "Низкий"
	TaskPriorityMedium   TaskPriority = "Средний"
	TaskPriorityHigh     TaskPriority = "Высокий"
	TaskPriorityCritical TaskPriority = "Критический"
)

// TaskType определяет возможные типы задач
type TaskType string

const (
	TaskTypeNewFeature    TaskType = "Новый функционал"
	TaskTypeBugfix        TaskType = "Исправление ошибки"
	TaskTypeImprovement   TaskType = "Улучшение"
	TaskTypeRefactoring   TaskType = "Рефакторинг"
	TaskTypeDocumentation TaskType = "Документация"
)

// ValidStatuses возвращает список валидных статусов
func ValidStatuses() []string {
	return []string{
		string(TaskStatusNew),
		string(TaskStatusInProgress),
		string(TaskStatusTesting),
		string(TaskStatusDone),
		string(TaskStatusCancelled),
	}
}

// ValidPriorities возвращает список валидных приоритетов
func ValidPriorities() []string {
	return []string{
		string(TaskPriorityLow),
		string(TaskPriorityMedium),
		string(TaskPriorityHigh),
		string(TaskPriorityCritical),
	}
}

// ValidTypes возвращает список валидных типов
func ValidTypes() []string {
	return []string{
		string(TaskTypeNewFeature),
		string(TaskTypeBugfix),
		string(TaskTypeImprovement),
		string(TaskTypeRefactoring),
		string(TaskTypeDocumentation),
	}
}

// IsValidStatus проверяет валидность статуса
func IsValidStatus(status string) bool {
	for _, validStatus := range ValidStatuses() {
		if status == validStatus {
			return true
		}
	}
	return false
}

// IsValidPriority проверяет валидность приоритета
func IsValidPriority(priority string) bool {
	for _, validPriority := range ValidPriorities() {
		if priority == validPriority {
			return true
		}
	}
	return false
}

// IsValidType проверяет валидность типа
func IsValidType(taskType string) bool {
	for _, validType := range ValidTypes() {
		if taskType == validType {
			return true
		}
	}
	return false
}
