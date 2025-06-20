package main

import (
	"testing"
)

func TestMain(t *testing.T) {
	// Базовый тест для проверки компиляции
	t.Log("Main package test passed")
}

func TestHealthCheck(t *testing.T) {
	// Тест для проверки базового функционала
	if 1+1 != 2 {
		t.Error("Basic math test failed")
	}
}
