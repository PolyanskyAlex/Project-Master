package models

import "time"

type Comment struct {
	ID             string    `json:"id" db:"id"`
	TaskID         string    `json:"taskId" db:"task_id"`
	UserIdentifier string    `json:"userIdentifier" db:"user_identifier"`
	Content        string    `json:"content" db:"content"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}
