# Исправление критической ошибки B006_EXT: Команды расширения не найдены

## ID Ошибки: B006_EXT
**Дата исправления:** 21.06.2025  
**Приоритет:** Критический  
**Статус:** Исправлено ✅  

## Проблема

### Основные симптомы:
1. **Ошибка активации расширения:**
   ```
   Error: command 'projectMaster.projectSelected' already exists
   at new PlanProvider (...src\providers\PlanProvider.ts:36:25)
   ```

2. **API 404 ошибки:**
   ```
   API Response Error: 404 Not Found
   url: "/api/functional-blocks"  (должно быть /api/v1/functional-blocks)
   ```

3. **Команды не найдены:**
   ```
   Error running command projectMaster.refreshProjects: command 'projectMaster.refreshProjects' not found
   ```

## Анализ первопричины

### Критическая ошибка #1: Дублирование команды
- Команда `projectMaster.projectSelected` регистрировалась **дважды**:
  - В `src/extension.ts` (правильно)  
  - В `src/providers/PlanProvider.ts` (ошибочно)
- Это приводило к **сбою активации** всего расширения

### Критическая ошибка #2: API недоступен
- Backend сервис временно недоступен
- Extension пыталась обратиться к API, получала 404 ошибки
- Из-за сбоя активации команды не регистрировались

## Примененные исправления

### Исправление 1: Убрано дублирование команды
**Файл:** `vscode-extension/src/providers/PlanProvider.ts`

**До:**
```typescript
constructor(
    private apiService: ApiService,
    private logger: Logger
) {
    // Listen for project selection events
    vscode.commands.registerCommand('projectMaster.projectSelected', (project: Project) => {
        this.setSelectedProject(project);
    });
}
```

**После:**
```typescript
constructor(
    private apiService: ApiService,
    private logger: Logger
) {
    // Note: projectMaster.projectSelected command is registered in extension.ts
    // This provider listens for project selection changes through setSelectedProject method
}
```

### Исправление 2: Восстановлена работа API
- Выполнено: `docker-compose up -d --build`
- Все сервисы запущены и работают корректно
- API endpoints доступны по правильным URL

### Исправление 3: Обновлена версия расширения
- Версия изменена с `0.4.0` на `0.4.1`
- Создан новый VSIX пакет с исправлениями

## Результаты тестирования

### Статус сервисов ✅
```bash
Container projectmaster-db-1        Healthy
Container projectmaster-backend-1   Healthy  
Container projectmaster-frontend-1  Started
```

### Компиляция расширения ✅
```bash
> tsc -p ./
# Компиляция прошла без ошибок
```

### Создание VSIX пакета ✅
```bash
DONE  Packaged: project-master-extension-0.4.1.vsix (512 files, 1.05MB)
```

## Установка исправленного расширения

1. **Удалите старую версию** из Cursor IDE
2. **Установите новую версию:**
   ```bash
   code --install-extension project-master-extension-0.4.1.vsix
   ```
3. **Перезапустите Cursor IDE**
4. **Проверьте команды в Command Palette:**
   - `Project Master: Refresh Projects`
   - `Project Master: Test Extension`

## Предотвращение рецидивов

### 1. Code Review Rules
- Всегда проверять на дублирование команд при регистрации
- Использовать единую точку регистрации команд в `extension.ts`

### 2. Тестирование активации
- Добавить автоматические тесты активации расширения
- Проверять отсутствие конфликтов команд

### 3. Мониторинг API
- Всегда проверять статус backend перед тестированием extension
- Добавить graceful degradation при недоступности API

## Файлы в составе исправления

- `vscode-extension/src/providers/PlanProvider.ts` - убрано дублирование команды
- `vscode-extension/package.json` - обновлена версия до 0.4.1
- `project-master-extension-0.4.1.vsix` - новый исправленный пакет
- `docs/BUGFIX_EXTENSION_COMMANDS.md` - данная документация

---
**Исправление применено успешно. Расширение готово к использованию.** 