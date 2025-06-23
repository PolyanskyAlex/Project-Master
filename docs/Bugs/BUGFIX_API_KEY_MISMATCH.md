# Исправление критического бага 401 Unauthorized API (B008_EXT)

## Обзор
Исправлен критический баг с расширением Project Master, который вызывал ошибки 401 Unauthorized при попытке загрузки проектов и задач.

## Проблема
**Первопричина**: Несоответствие API ключей между расширением и backend сервером.

### Симптомы
```javascript
[2025-06-22T09:46:51.714Z] [WARN] ⚠️ API Client Error
Data: {
  "status": 401,
  "statusText": "Unauthorized", 
  "data": "Unauthorized\n",
  "url": "/api/v1/projects",
  "method": "GET",
  "message": "Request failed with status code 401",
  "code": "ERR_BAD_REQUEST",
  "baseURL": "http://localhost:8080"
}
```

- "0 projects loaded successfully"
- "Failed to load tasks. Please check your API configuration"
- "Failed to load projects. Please check your API configuration"

## Техническая диагностика

### Проблема с API ключами
**Расширение отправляло**: `test-api-key-12345`
**Backend ожидал**: `dev-api-key-12345`

### Локация проблемы
1. **ConfigurationService.ts** (строка 22):
   ```typescript
   apiKey: this.config.get<string>('apiKey', 'test-api-key-12345')
   ```

2. **ConfigurationService.ts** (строка 43):
   ```typescript
   getApiKey(): string {
       return this.config.get<string>('apiKey', 'test-api-key-12345');
   }
   ```

3. **package.json** (строка 648):
   ```json
   "default": "test-api-key-12345"
   ```

4. **Backend .env** использовал:
   ```
   API_KEY=dev-api-key-12345
   ```

## Примененные исправления

### 1. ConfigurationService.ts
```diff
- apiKey: this.config.get<string>('apiKey', 'test-api-key-12345'),
+ apiKey: this.config.get<string>('apiKey', 'dev-api-key-12345'),

- return this.config.get<string>('apiKey', 'test-api-key-12345');
+ return this.config.get<string>('apiKey', 'dev-api-key-12345');
```

### 2. package.json
```diff  
- "default": "test-api-key-12345",
+ "default": "dev-api-key-12345",
```

### 3. Создан новый VSIX пакет
- Версия: `0.4.2`
- Файл: `project-master-extension-0.4.2.vsix`
- Создан скрипт пересборки: `rebuild-extension.bat`

## Инструкции по установке исправления

### Автоматическая пересборка
```batch
# Запустить скрипт пересборки
.\rebuild-extension.bat
```

### Ручная установка
1. **Удалить старое расширение**:
   - Extensions -> Project Master -> Uninstall

2. **Установить новую версию**:
   - Ctrl+Shift+P -> "Extensions: Install from VSIX"
   - Выбрать `project-master-extension-0.4.2.vsix`

3. **Перезагрузить IDE**:
   - Ctrl+Shift+P -> "Developer: Reload Window"

4. **Проверить backend**:
   - Backend должен работать на порту 8080
   - Использовать `.\dev-start.bat` для запуска

## Проверка исправления

### 1. Логи должны показывать успех
```javascript
[INFO] HTTP Request - Success | {
  "method": "GET",
  "url": "/api/v1/projects", 
  "status_code": 200
}
```

### 2. UI должен загружать данные
- Панель "Projects" показывает проекты
- Панель "Tasks" показывает задачи
- Отсутствуют ошибки в консоли

### 3. API Key в заголовках
```http
GET /api/v1/projects HTTP/1.1
X-API-Key: dev-api-key-12345
```

## Связанные исправления
- B007_EXT - Команда не найдена после восстановления backend 
- B009_EXT - Изменения не применяются (перезагрузка расширения)
- B010_SCRIPT - Исправление скриптов запуска dev-start.bat

## Профилактические меры

### 1. Централизованная конфигурация
Рекомендуется создать единый файл конфигурации для API ключей во избежание расхождений.

### 2. Валидация при сборке
Добавить проверку соответствия API ключей между компонентами в процессе сборки.

### 3. Документирование конфигурации
Поддерживать актуальную документацию по всем переменным окружения и их значениям.

## Статус
✅ **ИСПРАВЛЕНО** - Расширение Project Master теперь корректно авторизуется в API и успешно загружает данные. 