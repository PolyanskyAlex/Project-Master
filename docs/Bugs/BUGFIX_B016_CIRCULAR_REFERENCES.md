# BUGFIX B016_EXT: Циркулярные ссылки в объектах расширения

## Информация о баге
- **ID**: B016_EXT
- **Приоритет**: КРИТИЧЕСКИЙ
- **Дата**: 2024-12-19
- **Статус**: ИСПРАВЛЕН
- **Версия**: v0.4.5 → v0.4.6

## Описание проблемы

### Симптомы
Расширение Project Master падало с критическими ошибками при попытке выбрать проект в Tree View:
```
[Extension Host] rejected promise not handled within 1 second: Error: An object could not be cloned.
[Extension Host] stack trace: RangeError: Maximum call stack size exceeded
```

### Техническая причина
Циркулярные ссылки в объектах `Project` при передаче через `vscode.commands.executeCommand()`. VS Code не может сериализировать объекты с циркулярными ссылками между процессами Extension Host и Main Process.

### Затронутые файлы
- `vscode-extension/src/providers/ProjectsProvider.ts:40`
- `vscode-extension/src/extension.ts:88`
- `vscode-extension/src/commands/index.ts:60`
- `vscode-extension/src/commands/projectCommands.ts`

## Техническое решение

### Основной подход
Заменить передачу полных объектов `Project` на передачу только `project.id` через команды VS Code, затем восстанавливать объект по ID в получателе.

### Изменения в коде

#### 1. ProjectsProvider.ts
```typescript
// БЫЛО:
vscode.commands.executeCommand('projectMaster.projectSelected', project);
item.command = {
    command: 'projectMaster.selectProject',
    arguments: [project]
};

// СТАЛО:
vscode.commands.executeCommand('projectMaster.projectSelected', project.id);
item.command = {
    command: 'projectMaster.selectProject',
    arguments: [project.id]
};
```

#### 2. extension.ts
```typescript     
// БЫЛО:
vscode.commands.registerCommand('projectMaster.projectSelected', (project) => {
    projectsProvider.selectProject(project);
    // ...
});

// СТАЛО:
vscode.commands.registerCommand('projectMaster.projectSelected', (projectId: string) => {
    const project = projectsProvider.getProjectById(projectId);
    if (project) {
        projectsProvider.selectProject(project);
        // ...
    }
});
```

#### 3. commands/index.ts
```typescript
// БЫЛО:
const selectProjectCommand = vscode.commands.registerCommand('projectMaster.selectProject', 
    async (project: Project) => {

// СТАЛО:
const selectProjectCommand = vscode.commands.registerCommand('projectMaster.selectProject', 
    async (projectOrId: Project | string) => {
        const project = typeof projectOrId === 'string' 
            ? projectsProvider.getProjectById(projectOrId)
            : projectOrId;
```

## Тестирование

### Регрессионный тест
Создан специальный тест `ProjectsProvider.regression.test.ts` с проверками:
- Отсутствие ошибок циркулярных ссылок
- Правильное использование project ID в командах
- Безопасность сериализации
- Надежность поиска проектов по ID

### Результаты компиляции
```
✓ npm run compile - SUCCESS
✓ npm run package - SUCCESS (515 files, 1.06MB)
✓ Новый VSIX пакет project-master-extension-0.4.5.vsix создан
```

## Валидация исправления

### До исправления
- ❌ Ошибка "An object could not be cloned"
- ❌ "Maximum call stack size exceeded"
- ❌ Невозможность выбрать проект
- ❌ Бесконечные ошибки в консоли

### После исправления
- ✅ Команды используют только project ID
- ✅ Отсутствие циркулярных ссылок при сериализации
- ✅ Безопасная передача данных между процессами
- ✅ Надежное восстановление объектов по ID
- ✅ Обратная совместимость с существующим кодом

## Предотвращение регрессии

### Принципы
1. **Никогда не передавать полные объекты через vscode.commands**
2. **Всегда использовать примитивные типы (string, number) для межпроцессных команд**
3. **Восстанавливать объекты по ID в точке назначения**
4. **Добавлять валидацию существования объектов**

### Регрессионные тесты
- Автоматическая проверка отсутствия циркулярных ссылок
- Валидация типов аргументов команд
- Тесты сериализации/десериализации
- Проверка корректности поиска по ID

## Влияние на производительность
- ✅ **Положительное**: Уменьшение размера передаваемых данных
- ✅ **Улучшение**: Быстрее сериализация/десериализация
- ✅ **Безопасность**: Исключение ошибок циркулярных ссылок

## Совместимость
- ✅ Обратная совместимость сохранена
- ✅ API расширения не изменился
- ✅ Пользовательский интерфейс остался прежним
- ✅ Существующие команды работают корректно

## Заключение
Критический баг B016_EXT полностью исправлен. Решение применяет паттерн "ID-based command arguments" для предотвращения проблем с сериализацией объектов в VS Code Extension API. Добавлены регрессионные тесты для предотвращения повторения проблемы.

**Статус: РЕШЕНО ✅** 