# Диагностика проблем расширения Project Master

## Проблема: Команды расширения не найдены

**Симптомы:**
- `Error running command projectMaster.refreshProjects: command 'projectMaster.refreshProjects' not found`
- Команды не отображаются в Command Palette

## Пошаговая диагностика:

### Шаг 1: Проверить установлено ли расширение

1. **Откройте Cursor IDE**
2. **Перейдите в Extensions** (`Ctrl+Shift+X`)
3. **Найдите "Project Master"** в списке установленных расширений
4. **Проверьте статус:**
   - ✅ Установлено и активно
   - ❓ Установлено но не активно 
   - ❌ Не установлено

### Шаг 2: Установка/переустановка расширения

#### Если расширение НЕ установлено:

```bash
# В папке vscode-extension/
npm run package
```

Это создаст файл `project-master-extension-0.4.0.vsix`

**Установите расширение:**
1. `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
2. Выберите файл `project-master-extension-0.4.0.vsix`
3. Перезагрузите окно: `Ctrl+Shift+P` → "Developer: Reload Window"

#### Если расширение установлено но не работает:

1. **Отключите расширение:**
   - Extensions → Project Master → Disable
2. **Включите обратно:**
   - Extensions → Project Master → Enable
3. **Перезагрузите окно:** `Ctrl+Shift+P` → "Developer: Reload Window"

### Шаг 3: Диагностика через Developer Console

1. **Откройте Developer Tools:**
   ```
   Ctrl+Shift+P → "Developer: Toggle Developer Tools"
   ```

2. **Перейдите на вкладку Console**

3. **Вставьте и выполните диагностический скрипт:**

```javascript
// Скопируйте и вставьте этот код в консоль:
console.log('=== PROJECT MASTER DIAGNOSTIC ===');

// Проверка расширения
const ext = vscode.extensions.getExtension('project-master.project-master-extension');
console.log('Extension found:', !!ext);
if (ext) {
    console.log('Extension active:', ext.isActive);
    console.log('Extension path:', ext.extensionPath);
}

// Проверка команд
vscode.commands.getCommands(true).then(commands => {
    const pmCommands = commands.filter(cmd => cmd.startsWith('projectMaster.'));
    console.log('Project Master commands:', pmCommands.length);
    console.log('Commands list:', pmCommands);
    
    ['projectMaster.refreshProjects', 'projectMaster.test'].forEach(cmd => {
        console.log(`${cmd}: ${commands.includes(cmd) ? '✅' : '❌'}`);
    });
});
```

### Шаг 4: Проверка логов активации

В консоли ищите сообщения:
- `=== Project Master: activate() called ===`
- `=== PROJECT MASTER: REGISTER COMMANDS START ===`
- `Extension activation completed successfully`

**Если НЕТ логов активации** → расширение не активируется
**Если ЕСТЬ ошибки** → проблема в коде активации

### Шаг 5: Принудительная активация

Если расширение установлено но не активно:

```javascript
// В консоли Developer Tools:
const ext = vscode.extensions.getExtension('project-master.project-master-extension');
if (ext && !ext.isActive) {
    ext.activate().then(() => {
        console.log('Extension activated manually');
        // Попробуйте команду еще раз
    }).catch(error => {
        console.error('Activation failed:', error);
    });
}
```

## Быстрые решения:

### Решение 1: Полная переустановка
```bash
# В терминале Cursor:
cd vscode-extension
npm run compile
npm run package

# Затем в Cursor:
# Ctrl+Shift+P → "Extensions: Install from VSIX..."
# Выберите новый .vsix файл
# Ctrl+Shift+P → "Developer: Reload Window"
```

### Решение 2: Проверка backend
Убедитесь что backend работает:
```bash
curl -H "X-API-Key: test-api-key-12345" http://localhost:8080/health
# Должен вернуть: OK
```

### Решение 3: Очистка и пересборка
```bash
cd vscode-extension
rm -rf out/
rm -rf node_modules/
npm install
npm run compile
npm run package
```

## Ожидаемые результаты после исправления:

1. ✅ Команды появятся в Command Palette:
   - "Project Master: Test Extension"
   - "Project Master: Refresh Projects"
   - "Project Master: Sync Development Plan"

2. ✅ В Developer Console появятся логи:
   ```
   === Project Master: activate() called ===
   === PROJECT MASTER: REGISTER COMMANDS START ===
   Extension activation completed successfully
   ```

3. ✅ Tree View панели будут отображаться в боковой панели

## Контрольная проверка:

После выполнения исправлений протестируйте:

1. `Ctrl+Shift+P` → "Project Master: Test Extension"
   - Должно показать: "Extension is working!"

2. `Ctrl+Shift+P` → "Project Master: Refresh Projects"  
   - Должно показать прогресс и количество загруженных проектов

Если проблемы продолжаются, предоставьте:
- Логи из Developer Console
- Результат диагностического скрипта
- Версию Cursor IDE 