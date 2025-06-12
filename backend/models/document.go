package models

import "time"

type Document struct {
	ID            string    `json:"id" db:"id"`
	ProjectID     string    `json:"projectId" db:"project_id"`
	Type          string    `json:"type" db:"type"`
	Title         string    `json:"title" db:"title"`
	Content       string    `json:"content" db:"content"`
	AgentEditable bool      `json:"agentEditable" db:"agent_editable"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time `json:"updatedAt" db:"updated_at"`
}

// DocumentType определяет возможные типы документов
type DocumentType string

const (
	DocumentTypeBRD          DocumentType = "BRD"
	DocumentTypeSAD          DocumentType = "SAD"
	DocumentTypeAIReady      DocumentType = "AI-Ready"
	DocumentTypeAIExecutable DocumentType = "AI Executable"
	DocumentTypeTechnical    DocumentType = "Technical"
	DocumentTypeUserGuide    DocumentType = "User Guide"
	DocumentTypeAPIDoc       DocumentType = "API Documentation"
)

// ValidDocumentTypes возвращает список валидных типов документов
func ValidDocumentTypes() []string {
	return []string{
		string(DocumentTypeBRD),
		string(DocumentTypeSAD),
		string(DocumentTypeAIReady),
		string(DocumentTypeAIExecutable),
		string(DocumentTypeTechnical),
		string(DocumentTypeUserGuide),
		string(DocumentTypeAPIDoc),
	}
}

// IsValidDocumentType проверяет валидность типа документа
func IsValidDocumentType(docType string) bool {
	for _, validType := range ValidDocumentTypes() {
		if docType == validType {
			return true
		}
	}
	return false
}
