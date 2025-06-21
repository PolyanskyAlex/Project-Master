# Changelog

Все значимые изменения в проекте документируются в этом файле.

## [1.0.1] - 2025-06-21

### Исправлено
- **CORS Policy Error**: Исправлена ошибка блокировки CORS запросов с заголовком `Cache-Control`
  - Добавлен `Cache-Control` в `Access-Control-Allow-Headers` в backend CORS middleware
  - Добавлены регрессионные тесты для проверки CORS функциональности
  - Полностью восстановлена связь между frontend и backend
  - Файлы: `backend/router/router.go`, `backend/router/router_test.go`

### Добавлено
- Регрессионные тесты для CORS middleware
- Документация по исправлению бага в `docs/BUGFIX_CORS_CACHE_CONTROL.md`

## [1.0.0] - 2025-06-20

### Добавлено
- Полная система управления проектами
- Go backend с REST API
- React frontend с TypeScript
- PostgreSQL база данных
- VS Code расширение
- Docker развертывание
- Автоматическое тестирование
- Документация проекта

### Компоненты
- 27 задач разработки выполнено (100%)
- 8 таблиц в базе данных
- Полный CRUD функционал
- Система аутентификации
- Логирование операций
- CI/CD пайплайн 