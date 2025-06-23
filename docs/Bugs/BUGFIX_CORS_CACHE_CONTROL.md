# Исправление CORS Policy Error с Cache-Control заголовком

## Проблема

**Дата:** 21.06.2025  
**Серьезность:** Критическая  
**Статус:** Исправлена  

### Описание
Frontend приложение не могло подключиться к backend API из-за CORS ошибки:
```
Access to fetch at 'http://localhost:8080/health' from origin 'http://localhost:3000' has been blocked by CORS policy: Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response.
```

### Воздействие
- Полная неработоспособность frontend приложения
- Отсутствие связи между frontend и backend
- Невозможность выполнения API запросов

## Корневая причина

CORS middleware в backend (`backend/router/router.go`) не включал заголовок `Cache-Control` в список разрешенных заголовков `Access-Control-Allow-Headers`. Frontend отправлял этот заголовок в preflight OPTIONS запросах, что приводило к блокировке всех запросов браузером.

**Файл:** `backend/router/router.go:20`  
**Проблемная строка:**
```go
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
```

## Решение

### Изменения в коде

1. **Обновлен CORS middleware** (`backend/router/router.go`):
   ```go
   // Было:
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
   
   // Стало:
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Cache-Control")
   ```

2. **Добавлены регрессионные тесты** (`backend/router/router_test.go`):
   - `TestCORSMiddleware_AllowsCacheControlHeader()` - проверяет preflight запросы
   - `TestCORSMiddleware_AllowsActualHealthRequest()` - проверяет реальные API запросы

### Результаты тестирования

```bash
=== RUN   TestCORSMiddleware_AllowsCacheControlHeader
--- PASS: TestCORSMiddleware_AllowsCacheControlHeader (0.00s)
=== RUN   TestCORSMiddleware_AllowsActualHealthRequest
--- PASS: TestCORSMiddleware_AllowsActualHealthRequest (0.00s)
ok      project-manager/router  0.016s
```

### Валидация исправления

- ✅ Unit тесты проходят
- ✅ Backend принимает запросы с Cache-Control заголовком
- ✅ CORS preflight запросы обрабатываются корректно
- ✅ Frontend может подключаться к backend API

## Предотвращение повторения

### Рекомендации

1. **Расширить CORS конфигурацию** для поддержки всех стандартных заголовков:
   ```go
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Cache-Control, Authorization, Accept, Origin, X-Requested-With")
   ```

2. **Добавить мониторинг CORS ошибок** в логирование backend

3. **Документировать требования к CORS** в техническом руководстве

### Связанные файлы
- `backend/router/router.go` - CORS middleware
- `backend/router/router_test.go` - регрессионные тесты
- `frontend/src/utils/serverDiscovery.ts` - клиентские запросы с Cache-Control
- `frontend/src/services/api.ts` - конфигурация axios клиента

## Технические детали

### Анализ запросов

**Preflight OPTIONS запрос:**
```http
OPTIONS /health HTTP/1.1
Origin: http://localhost:3000
Access-Control-Request-Method: GET
Access-Control-Request-Headers: cache-control
```

**Ответ backend (после исправления):**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key, Cache-Control
```

### Архитектурные соображения

CORS политика должна быть настроена с учетом всех заголовков, которые могут отправлять современные HTTP клиенты, включая:
- `Cache-Control` - для управления кэшированием
- `Authorization` - для аутентификации
- `Accept` - для согласования контента
- `Origin` - для идентификации источника запроса

---

**Автор:** AI Assistant  
**Дата создания:** 21.06.2025  
**Версия:** 1.0 