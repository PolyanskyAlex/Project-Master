package models

import (
	"encoding/json"
	"time"
)

type OperationLog struct {
	ID             string          `json:"id" db:"id"`
	TaskID         string          `json:"taskId" db:"task_id"`
	UserIdentifier string          `json:"userIdentifier" db:"user_identifier"`
	OperationType  string          `json:"operationType" db:"operation_type"`
	Details        json.RawMessage `json:"details" db:"details"`
	CreatedAt      time.Time       `json:"createdAt" db:"created_at"`
}

// OperationType определяет возможные типы операций
type OperationType string

const (
	OperationTypeCreate       OperationType = "CREATE"
	OperationTypeUpdate       OperationType = "UPDATE"
	OperationTypeDelete       OperationType = "DELETE"
	OperationTypeComment      OperationType = "COMMENT"
	OperationTypeStatusChange OperationType = "STATUS_CHANGE"
)

// ValidOperationTypes возвращает список валидных типов операций
func ValidOperationTypes() []string {
	return []string{
		string(OperationTypeCreate),
		string(OperationTypeUpdate),
		string(OperationTypeDelete),
		string(OperationTypeComment),
		string(OperationTypeStatusChange),
	}
}

// IsValidOperationType проверяет валидность типа операции
func IsValidOperationType(operationType string) bool {
	for _, validType := range ValidOperationTypes() {
		if operationType == validType {
			return true
		}
	}
	return false
}
