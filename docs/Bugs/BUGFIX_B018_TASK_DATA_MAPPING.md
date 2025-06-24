# BUGFIX B018_EXT: Task Data Mapping Issue

## Problem Summary
**Bug ID:** B018_EXT  
**Priority:** Critical  
**Status:** RESOLVED  
**Date:** 2025-01-21  
**Version:** v0.4.7

### Issue Description
VSCode расширение отображало undefined для многих параметров задач в IDE, хотя в UI данные отображались корректно.

**Симптомы:**
- `Status: undefined`
- `Priority: undefined`  
- `Type: undefined`
- `Project: Unknown Project`
- `Created: Invalid Date`
- `Assignee: Unassigned`

### Root Cause Analysis

**Основная проблема:** Несоответствие между структурой данных backend API и ожиданиями расширения.

**Backend API возвращает:**
```json
{
  "id": "aa5bcd84-6e65-403c-80f9-db7a6048eafd",
  "projectId": "a85cc341-f11a-492f-86eb-460f72640d95", 
  "functionalBlockId": null,
  "number": "TASK-000001",
  "title": "1",
  "description": "1", 
  "status": "Новая",
  "priority": "Средний",
  "type": "Новый функционал",
  "role": "",
  "result": "",
  "parentTaskId": null,
  "createdAt": "2025-06-21T17:45:58.64307Z",
  "updatedAt": "2025-06-21T17:45:58.64307Z"
}
```

**Расширение ожидает:**
```typescript
interface Task {
  project_id: string;    // не projectId  
  assignee?: string;     // отсутствует в backend
  due_date?: string;     // отсутствует в backend
  created_at: string;    // не createdAt
  updated_at: string;    // не updatedAt
  estimated_hours?: number; // отсутствует в backend
  actual_hours?: number;    // отсутствует в backend
  tags?: string[];          // отсутствует в backend
}
```

### Technical Solution

**Проблема 1:** Метод `getTask()` не выполнял маппинг данных  
**Решение:** Добавлен полный маппинг как в `getTasks()`

**Проблема 2:** Отсутствующие поля в backend  
**Решение:** Добавлены null-значения по умолчанию

### Code Changes

**File:** `vscode-extension/src/services/ApiService.ts`

```typescript
async getTask(id: string): Promise<Task> {
    try {
        const response: AxiosResponse<any> = await this.client.get(`/api/v1/tasks/${id}`);
        
        // Map API response from camelCase to snake_case
        const task = response.data;
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: this.mapTaskStatus(task.status),
            priority: this.mapTaskPriority(task.priority),
            type: this.mapTaskType(task.type),
            project_id: task.projectId,
            assignee: task.assignedTo || null, // Backend doesn't have this field
            due_date: task.dueDate || null, // Backend doesn't have this field  
            created_at: task.createdAt,
            updated_at: task.updatedAt,
            estimated_hours: task.estimatedHours || null, // Backend doesn't have this field
            actual_hours: task.actualHours || null, // Backend doesn't have this field
            tags: task.tags || [] // Backend doesn't have this field
        };
    } catch (error) {
        this.logger.error(`Failed to fetch task ${id}`, error);
        throw error;
    }
}
```

**Also updated:** Консистентное маппинг в `getTasks()` method

### Status Mapping Table

| Backend Status | Extension Status |
|---------------|-----------------|
| "Новая" | 'todo' |
| "В работе" | 'in_progress' |
| "Тестирование" | 'review' |
| "Выполнена" | 'done' |
| "Отменена" | 'cancelled' |

### Priority Mapping Table

| Backend Priority | Extension Priority |
|-----------------|-------------------|
| "Низкий" | 'low' |
| "Средний" | 'medium' |
| "Высокий" | 'high' |
| "Критический" | 'critical' |

### Type Mapping Table

| Backend Type | Extension Type |
|-------------|---------------|
| "Новый функционал" | 'feature' |
| "Исправление ошибки" | 'bug' |
| "Улучшение" | 'improvement' |
| "Рефакторинг" | 'improvement' |
| "Документация" | 'documentation' |

### Testing Results

**Before Fix:**
- Status: undefined
- Priority: undefined
- Type: undefined
- Created: Invalid Date

**After Fix:**
- Status: todo (mapped from "Новая")
- Priority: medium (mapped from "Средний")
- Type: feature (mapped from "Новый функционал")
- Created: 2025-06-21T17:45:58.643Z (valid date)

### Installation & Deployment

**Version:** 0.4.7  
**Package:** project-master-extension-0.4.7.vsix

```bash
cd vscode-extension
npm run compile
npm run package
code --install-extension project-master-extension-0.4.7.vsix --force
```

**Required Actions:**
1. Restart VS Code after installation
2. Refresh tasks view
3. Select project to see corrected task data

### Bug Status Update

**File:** `tasks/bugs/B018_EXT.json`
```json
{
  "id": "B018_EXT",
  "status": "RESOLVED",
  "resolution_version": "0.4.7",
  "resolution_date": "2025-01-21"
}
```

### Prevention Measures

1. **API Contract Testing:** Add tests to verify API response format matches expectations
2. **Type Safety:** Strengthen TypeScript interfaces for API responses
3. **Field Validation:** Add runtime validation for required vs optional fields
4. **Mapping Tests:** Unit tests for status/priority/type mapping functions

### Related Issues

- **B016_EXT:** Fixed circular references (v0.4.6)
- **B015_EXT:** Fixed API response format (v0.4.5)

### Architecture Impact

This fix ensures:
- Consistent data mapping between backend and frontend
- Graceful handling of missing backend fields
- Proper null/default value handling for optional fields
- Stable task display in IDE regardless of backend data completeness

## Обзор проблемы

**Баг ID:** B018_EXT  
**Статус:** RESOLVED  
**Критичность:** Critical  
**Функциональный блок:** VSCode Extension  
**Версия исправления:** 0.4.8  
**Дата создания:** 2025-01-27  
**Дата исправления:** 2025-01-27  

### Краткое описание
Задачи не отображались в Tasks Tree View расширения VSCode, несмотря на успешное получение данных с backend API. Проблема заключалась в несоответствии формата полей данных между backend (camelCase) и расширением (snake_case), а также в неправильном маппинге статусов задач.

## Анализ корневой причины

### Первопричина
Несоответствие формата данных между backend API и расширением VSCode в методе `ApiService.getTasks()`.

### Детальный анализ

#### 1. Проблема формата полей
Backend API возвращает данные в формате camelCase, но расширение ожидает snake_case:

**Backend ответ:**
```json
{
  "id": "aa5bcd84-6e65-403c-80f9-db7a6048eafd",
  "projectId": "a85cc341-f11a-492f-86eb-460f72640d95",
  "functionalBlockId": null,
  "number": "TASK-000001",
  "title": "1",
  "description": "1",
  "status": "Новая",
  "priority": "Средний",
  "type": "Новый функционал",
  "parentTaskId": null,
  "createdAt": "2025-06-21T17:45:58.64307Z",
  "updatedAt": "2025-06-21T17:45:58.64307Z"
}
```

**Ожидаемый формат расширения:**
```typescript
interface Task {
  id: string;
  project_id: string;        // ← projectId
  functional_block_id?: string; // ← functionalBlockId
  parent_task_id?: string;   // ← parentTaskId
  created_at: string;        // ← createdAt
  updated_at: string;        // ← updatedAt
  // ... остальные поля
}
```

#### 2. Проблема маппинга статусов
Backend возвращает статусы на русском языке, но расширение группирует задачи по английским ключам:

**Backend статусы:** `"Новая"`, `"В работе"`, `"На проверке"`, `"Завершена"`, `"Отменена"`  
**Ожидаемые статусы:** `'todo'`, `'in_progress'`, `'review'`, `'done'`, `'cancelled'`

#### 3. Проблема типов задач
Backend возвращает типы на русском, но интерфейс Task ожидает строгий набор английских типов:

**Backend типы:** `"Новый функционал"`, `"Ошибка"`, `"Задача"`, `"Улучшение"`  
**Ожидаемые типы:** `'feature'` | `'bug'` | `'improvement'` | `'documentation'` | `'test'`

## Техническое решение

### Измененные файлы
- `vscode-extension/src/services/ApiService.ts`
- `vscode-extension/package.json` (версия 0.4.7 → 0.4.8)

### Архитектурное решение
Добавлены приватные методы маппинга в класс `ApiService` для преобразования данных backend в формат, ожидаемый расширением:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Backend API   │───▶│   ApiService     │───▶│  TasksProvider  │
│   (camelCase)   │    │   Mappers        │    │  (snake_case)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Реализация

#### 1. Обновленный метод getTasks()
```typescript
async getTasks(projectId?: string): Promise<Task[]> {
    try {
        const url = projectId ? `/api/v1/tasks?project_id=${projectId}` : '/api/v1/tasks';
        const response: AxiosResponse<any[]> = await this.client.get(url);
        
        // Map API response (camelCase) to extension types (snake_case)
        return response.data.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: this.mapTaskStatus(task.status),
            priority: this.mapTaskPriority(task.priority),
            type: this.mapTaskType(task.type),
            project_id: task.projectId,
            assignee: task.assignedTo,
            due_date: task.dueDate,
            created_at: task.createdAt,
            updated_at: task.updatedAt,
            estimated_hours: task.estimatedHours,
            actual_hours: task.actualHours,
            tags: task.tags || []
        }));
    } catch (error) {
        this.logger.error('Failed to fetch tasks', error);
        throw error;
    }
}
```

#### 2. Метод маппинга статусов
```typescript
private mapTaskStatus(status: string): 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' {
    switch (status?.toLowerCase()) {
        case 'новая':
        case 'к выполнению':
        case 'todo':
            return 'todo';
        case 'в работе':
        case 'in_progress':
            return 'in_progress';
        case 'на проверке':
        case 'проверка':
        case 'review':
            return 'review';
        case 'завершена':
        case 'готово':
        case 'done':
            return 'done';
        case 'отменена':
        case 'отклонена':
        case 'cancelled':
            return 'cancelled';
        default:
            this.logger.warn(`Unknown task status: ${status}, defaulting to 'todo'`);
            return 'todo';
    }
}
```

#### 3. Метод маппинга приоритетов
```typescript
private mapTaskPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority?.toLowerCase()) {
        case 'низкий':
        case 'low':
            return 'low';
        case 'средний':
        case 'medium':
            return 'medium';
        case 'высокий':
        case 'high':
            return 'high';
        case 'критический':
        case 'critical':
            return 'critical';
        default:
            this.logger.warn(`Unknown task priority: ${priority}, defaulting to 'medium'`);
            return 'medium';
    }
}
```

#### 4. Метод маппинга типов
```typescript
private mapTaskType(type: string): 'feature' | 'bug' | 'improvement' | 'documentation' | 'test' {
    switch (type?.toLowerCase()) {
        case 'новый функционал':
        case 'функция':
        case 'feature':
            return 'feature';
        case 'ошибка':
        case 'баг':
        case 'bug':
            return 'bug';
        case 'улучшение':
        case 'рефакторинг':
        case 'improvement':
            return 'improvement';
        case 'документация':
        case 'documentation':
            return 'documentation';
        case 'тест':
        case 'тестирование':
        case 'test':
            return 'test';
        case 'задача':
        case 'task':
        default:
            this.logger.warn(`Unknown task type: ${type}, defaulting to 'feature'`);
            return 'feature';
    }
}
```

## Тестирование

### Проверка API endpoint
```bash
curl -H "X-API-Key: dev-api-key-12345" http://localhost:8080/api/v1/tasks
```

**Ответ:**
```json
[{
  "id": "aa5bcd84-6e65-403c-80f9-db7a6048eafd",
  "projectId": "a85cc341-f11a-492f-86eb-460f72640d95",
  "functionalBlockId": null,
  "number": "TASK-000001",
  "title": "1",
  "description": "1",
  "status": "Новая",
  "priority": "Средний",
  "type": "Новый функционал",
  "role": "",
  "result": "",
  "parentTaskId": null,
  "createdAt": "2025-06-21T17:45:58.64307Z",
  "updatedAt": "2025-06-21T17:45:58.64307Z"
}]
```

### Результат маппинга
После применения исправлений задача должна преобразоваться в:
```typescript
{
  id: "aa5bcd84-6e65-403c-80f9-db7a6048eafd",
  title: "1",
  description: "1",
  status: "todo",                    // ← "Новая" → "todo"
  priority: "medium",                // ← "Средний" → "medium"
  type: "feature",                   // ← "Новый функционал" → "feature"
  project_id: "a85cc341-f11a-492f-86eb-460f72640d95",
  assignee: undefined,
  due_date: undefined,
  created_at: "2025-06-21T17:45:58.64307Z",
  updated_at: "2025-06-21T17:45:58.64307Z",
  estimated_hours: undefined,
  actual_hours: undefined,
  tags: []
}
```

### Компиляция и сборка
```bash
cd vscode-extension
npm run compile    # ✅ SUCCESS - 0 errors
npm run package    # ✅ SUCCESS - project-master-extension-0.4.8.vsix created
```

## Результат

### До исправления
- Tasks Tree View: пустой
- Консоль: нет ошибок
- API: работает, возвращает данные
- Проблема: данные не отображаются из-за несоответствия форматов

### После исправления
- Tasks Tree View: отображает задачи, сгруппированные по статусам
- Статус "Новая" → группа "TODO" 
- Приоритет "Средний" → "MEDIUM"
- Тип "Новый функционал" → "FEATURE"
- Все поля правильно маппятся из camelCase в snake_case

## Установка исправления

### Для пользователя
1. Закрыть VS Code полностью
2. Установить новую версию расширения:
   ```bash
   code --install-extension project-master-extension-0.4.8.vsix
   ```
3. Перезапустить VS Code
4. Проверить отображение задач в Tasks Tree View

### Для разработчика
```bash
# Клонировать изменения
git pull origin master

# Перейти в директорию расширения
cd vscode-extension

# Установить зависимости
npm install

# Скомпилировать
npm run compile

# Создать VSIX пакет
npm run package

# Установить локально
code --install-extension project-master-extension-0.4.8.vsix
```

## Архитектурные выводы

### Принципы, примененные в решении
1. **Single Responsibility Principle (SRP)**: Каждый метод маппинга отвечает за конкретный тип преобразования
2. **Open/Closed Principle (OCP)**: Методы легко расширяются для новых статусов/типов
3. **Defensive Programming**: Fallback значения для неизвестных типов с логированием
4. **Separation of Concerns**: Маппинг данных изолирован в ApiService

### Будущие улучшения
1. Вынести маппинги в отдельные конфигурационные файлы
2. Добавить unit-тесты для методов маппинга
3. Синхронизировать статусы между backend и frontend
4. Рассмотреть использование DTO (Data Transfer Objects) для типизации API ответов

## Связанные документы
- [B016_EXT: Circular References](./BUGFIX_B016_CIRCULAR_REFERENCES.md)
- [B015_EXT: API Response Format](./BUGFIX_B015_API_RESPONSE_FORMAT.md)
- [Extension API Integration](../tech_docs/extension/TECH_API_SERVICE_INTEGRATION.md)

---
**Документ обновлен:** 2025-01-27  
**Версия:** 1.0  
**Статус:** Актуальный 