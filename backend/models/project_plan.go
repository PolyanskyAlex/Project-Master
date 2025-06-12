package models

import "time"

type ProjectPlanSequence struct {
	ID            string    `json:"id" db:"id"`
	ProjectID     string    `json:"projectId" db:"project_id"`
	TaskID        string    `json:"taskId" db:"task_id"`
	SequenceOrder int       `json:"sequenceOrder" db:"sequence_order"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time `json:"updatedAt" db:"updated_at"`
}

// ProjectPlanItem представляет элемент плана с информацией о задаче
type ProjectPlanItem struct {
	ID            string    `json:"id" db:"id"`
	ProjectID     string    `json:"projectId" db:"project_id"`
	TaskID        string    `json:"taskId" db:"task_id"`
	SequenceOrder int       `json:"sequenceOrder" db:"sequence_order"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time `json:"updatedAt" db:"updated_at"`

	// Информация о задаче
	TaskNumber      string `json:"taskNumber" db:"task_number"`
	TaskTitle       string `json:"taskTitle" db:"task_title"`
	TaskDescription string `json:"taskDescription" db:"task_description"`
	TaskStatus      string `json:"taskStatus" db:"task_status"`
	TaskPriority    string `json:"taskPriority" db:"task_priority"`
	TaskType        string `json:"taskType" db:"task_type"`
}

// ProjectPlan представляет полный план проекта
type ProjectPlan struct {
	ProjectID string            `json:"projectId"`
	Items     []ProjectPlanItem `json:"items"`
}

// ReorderRequest представляет запрос на изменение порядка задач
type ReorderRequest struct {
	TaskSequences []TaskSequence `json:"taskSequences"`
}

type TaskSequence struct {
	TaskID        string `json:"taskId"`
	SequenceOrder int    `json:"sequenceOrder"`
}
