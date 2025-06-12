package models

import "time"

type FunctionalBlock struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Prefix    string    `json:"prefix" db:"prefix"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}
