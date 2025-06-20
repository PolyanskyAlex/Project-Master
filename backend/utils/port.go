package utils

import (
	"fmt"
	"net"
	"strconv"
)

// FindAvailablePort находит свободный порт, начиная с preferredPort
func FindAvailablePort(preferredPort int) (int, error) {
	// Сначала проверяем предпочтительный порт
	if isPortAvailable(preferredPort) {
		return preferredPort, nil
	}

	// Если предпочтительный порт занят, ищем следующий свободный
	for port := preferredPort + 1; port <= preferredPort+100; port++ {
		if isPortAvailable(port) {
			return port, nil
		}
	}

	return 0, fmt.Errorf("не удалось найти свободный порт в диапазоне %d-%d", preferredPort, preferredPort+100)
}

// isPortAvailable проверяет, доступен ли порт
func isPortAvailable(port int) bool {
	address := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return false
	}
	defer listener.Close()
	return true
}

// ParsePort безопасно парсит строку порта в int
func ParsePort(portStr string) (int, error) {
	if portStr == "" {
		return 8080, nil // значение по умолчанию
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return 0, fmt.Errorf("неверный формат порта: %s", portStr)
	}

	if port < 1 || port > 65535 {
		return 0, fmt.Errorf("порт должен быть в диапазоне 1-65535, получен: %d", port)
	}

	return port, nil
}
