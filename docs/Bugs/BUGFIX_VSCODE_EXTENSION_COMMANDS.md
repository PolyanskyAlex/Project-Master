# Bugfix: VS Code Extension Commands Not Found

**Дата:** 2024-12-19  
**Задача:** B001_EXT  
**Статус:** Исправлено  
**Критичность:** Critical  

## Описание проблемы

### Симптомы
- Команды `projectMaster.syncPlan` и `projectMaster.refreshProjects` не найдены в Command Palette Cursor IDE
- Сообщение об ошибке: "command 'projectMaster.syncPlan' not found"
- Расширение не активировалось корректно в Cursor IDE

### Окружение
- **IDE:** Cursor IDE
- **ОС:** Windows 10
- **Версия расширения:** 0.0.19 → 0.4.0
- **VS Code Engine:** ^1.96.0

## Анализ первопричины

### Трассировка проблемы
1. **Активация расширения:** `onStartupFinished` не срабатывал в Cursor IDE
2. **Регистрация команд:** Без активации команды не регистрировались
3. **Отсутствие диагностики:** Недостаточное логирование для отладки

### Архитектурная схема проблемы
```
Cursor IDE Startup
       ↓
activationEvents: ["onStartupFinished"] ← ПРОБЛЕМА: не срабатывает
       ↓
activate() не вызывается
       ↓
registerCommands() не выполняется
       ↓
Команды не доступны в Command Palette
```

## Решение

### Внесенные изменения

#### 1. Обновление activationEvents (package.json)
```json
"activationEvents": [
  "*",                                    // ← Принудительная активация
  "onStartupFinished",                   // ← Сохранен для совместимости
  "onCommand:projectMaster.syncPlan",    // ← Активация по команде
  "onCommand:projectMaster.refreshProjects"
]
```

#### 2. Улучшенное логирование (src/commands/index.ts)
```typescript
// Детальное логирование активации
console.log('=== PROJECT MASTER: REGISTER COMMANDS START ===');
console.log('Commands registration context:', {
    subscriptions: context.subscriptions.length,
    deps: Object.keys(deps)
});

// Верификация регистрации команд
console.log('=== PROJECT MASTER: COMMAND REGISTRATION VERIFICATION ===');
console.log('Total subscriptions added to context:', totalCommands);
```

#### 3. Расширенная обработка ошибок
```typescript
try {
    console.log('Calling planProvider.syncPlan()...');
    await planProvider.syncPlan();
    console.log('planProvider.syncPlan() completed successfully');
    logger.info('Development plan synced successfully');
} catch (error) {
    console.error('Sync plan command failed:', error);
    logger.error('Failed to sync development plan', error);
    vscode.window.showErrorMessage(`Failed to sync development plan: ${error}`);
}
```

#### 4. Автоматизация сборки
```json
"package": "vsce package --allow-star-activation"
```

### Архитектурная схема решения
```
Cursor IDE Startup
       ↓
activationEvents: ["*"] ← ИСПРАВЛЕНО: принудительная активация
       ↓
activate() вызывается ВСЕГДА
       ↓
registerCommands() выполняется с логированием
       ↓
Команды доступны в Command Palette
       ↓
Детальные логи для диагностики
```

## Тестирование

### Регрессионные тесты
Создан тест `commandRegistration.test.ts`:
```typescript
test('Critical commands should be registered', async () => {
    registerCommands(context, mockDeps);
    
    const commands = await vscode.commands.getCommands(true);
    const projectMasterCommands = commands.filter(cmd => cmd.startsWith('projectMaster.'));
    
    assert.ok(projectMasterCommands.includes('projectMaster.syncPlan'));
    assert.ok(projectMasterCommands.includes('projectMaster.refreshProjects'));
});
```

### Интеграционное тестирование
1. ✅ Компиляция TypeScript без ошибок
2. ✅ Создание VSIX пакета (project-master-extension-0.4.0.vsix)
3. ✅ Backend API доступен (http://localhost:8080/health → OK)
4. ✅ Расширенное логирование активации

## Развертывание

### Инструкции по установке
```bash
# В директории vscode-extension
npm run compile
npm run package

# Установка в Cursor IDE
# Extensions → Install from VSIX → project-master-extension-0.4.0.vsix
```

### Верификация исправления
1. Открыть Command Palette (Ctrl+Shift+P)
2. Ввести "Project Master"
3. Проверить наличие команд:
   - `Project Master: Sync Plan`
   - `Project Master: Refresh Projects`
4. Проверить логи в Developer Console

## Мониторинг и диагностика

### Логи активации
```
=== PROJECT MASTER: REGISTER COMMANDS START ===
Commands registration context: { subscriptions: 0, deps: [...] }
=== PROJECT MASTER: COMMAND REGISTRATION VERIFICATION ===
Total subscriptions added to context: 15
```

### Логи выполнения команд
```
=== PROJECT MASTER: SYNC PLAN COMMAND EXECUTED ===
Selected project for sync: ProjectName
Calling planProvider.syncPlan()...
planProvider.syncPlan() completed successfully
```

### Индикаторы проблем
- Отсутствие логов активации → Расширение не загружается
- "command not found" → Команды не зарегистрированы
- Ошибки в console.log → Проблемы в коде

## Предотвращение регрессий

### Автоматизированные проверки
1. **Pre-commit hooks:** Компиляция TypeScript
2. **Регрессионные тесты:** Проверка регистрации команд
3. **CI/CD:** Автоматическая сборка VSIX пакетов

### Рекомендации
1. Всегда использовать `activationEvents: ["*"]` для критичных расширений
2. Добавлять подробное логирование для диагностики
3. Тестировать в целевой IDE (Cursor) перед релизом
4. Создавать регрессионные тесты для каждого исправленного бага

## Связанные документы
- [SAD.md](../project_docs/SAD.md) - Архитектура системы
- [BUGFIX_CORS_CACHE_CONTROL.md](BUGFIX_CORS_CACHE_CONTROL.md) - Предыдущее исправление
- [CI_CD_DOCUMENTATION.md](CI_CD_DOCUMENTATION.md) - Процессы CI/CD

---
*Документ создан в соответствии с bugfix pipeline и tech_docs правилами* 