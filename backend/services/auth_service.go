package services

import "project-manager/config"

type AuthService struct {
	apiKey string
}

func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{apiKey: cfg.APIKey}
}

func (s *AuthService) IsAPIKeyValid(key string) bool {
	return key != "" && key == s.apiKey
}
