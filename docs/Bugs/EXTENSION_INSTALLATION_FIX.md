# Инструкция: Установка исправленной версии расширения Project Master

**ID Задачи:** B009_EXT  
**Дата:** 2024-12-22  
**Проблема:** Cursor IDE загружает старую версию расширения из пакета вместо исправленной версии

## 🚨 **ПРОБЛЕМА**

Ваша Cursor IDE загружает расширение из:
```
c:\Users\user\.cursor\extensions\project-master.project-master-extension-0.4.1\
```

Это **старая версия** без исправлений. Поэтому вы видите:
- ❌ `command 'projectMaster.projectSelected' already exists`
- ❌ `401 Unauthorized API errors`

## ✅ **РЕШЕНИЕ**

### **Шаг 1: Удалить старое расширение**

1. **Откройте Cursor IDE**
2. **Перейдите в Extensions** (`Ctrl+Shift+X`)
3. **Найдите "Project Master"** в списке установленных
4. **Нажмите кнопку "Uninstall"** ⚠️ **ОБЯЗАТЕЛЬНО!**
5. **Перезапустите Cursor IDE** полностью

### **Шаг 2: Установить исправленную версию**

#### **Вариант A: Установка из пакета (Рекомендуется)**

1. **Откройте Command Palette** (`Ctrl+Shift+P`)
2. **Введите:** `Extensions: Install from VSIX...`
3. **Выберите файл:** 
   ```
   D:\Alex\Soft Development2\Product_Factory\Project Master\vscode-extension\project-master-extension-0.4.1.vsix
   ```
4. **Дождитесь установки**
5. **Перезагрузите окно:** `Ctrl+Shift+P` → `Developer: Reload Window`

#### **Вариант B: Разработческий режим**

1. **Откройте папку проекта в Cursor:**
   ```
   D:\Alex\Soft Development2\Product_Factory\Project Master\
   ```
2. **Нажмите F5** для запуска Extension Development Host
3. **В новом окне проверьте работу расширения**

### **Шаг 3: Проверка исправлений**

После установки исправленной версии проверьте:

1. **Откройте Developer Console** (`Ctrl+Shift+I`)
2. **Перезагрузите окно** (`Ctrl+Shift+P` → `Developer: Reload Window`)
3. **Проверьте логи** - НЕ должно быть:
   ```
   ❌ command 'projectMaster.projectSelected' already exists
   ❌ 401 Unauthorized
   ```
4. **Должно быть:**
   ```
   ✅ === Project Master: activate() called ===
   ✅ === Project Master: registerCommands() called ===
   ✅ Commands registered successfully
   ```

### **Шаг 4: Тест функциональности**

1. **Проверьте панели Project Master** в боковой панели
2. **Попробуйте команду:** `Ctrl+Shift+P` → `Project Master: Refresh Projects`
3. **Должны загрузиться проекты** без ошибок 401

## 🔧 **ЧТО ИСПРАВЛЕНО В НОВОЙ ВЕРСИИ**

### Исправление 1: Дублирование команды
```typescript
// УДАЛЕНО из TasksProvider.ts:
❌ vscode.commands.registerCommand('projectMaster.projectSelected', ...)

// ОСТАЕТСЯ ТОЛЬКО в extension.ts:
✅ vscode.commands.registerCommand('projectMaster.projectSelected', (project) => {
    projectsProvider.selectProject(project);
    tasksProvider.setSelectedProject(project);  
    planProvider.setSelectedProject(project);
    updateTreeViewTitles();
});
```

### Исправление 2: API авторизация
```typescript
// ConfigurationService.ts:
getApiKey(): string {
    return this.config.get<string>('apiKey', 'test-api-key-12345'); // ✅ Исправлено
}

// package.json:
"projectMaster.apiKey": {
    "default": "test-api-key-12345" // ✅ Исправлено
}
```

## 🚨 **ВАЖНО**

**ОБЯЗАТЕЛЬНО удалите старое расширение** перед установкой нового! Иначе Cursor может продолжать использовать старую версию.

## 📍 **Пути файлов**

- **Старое расширение (удалить):** `c:\Users\user\.cursor\extensions\project-master.project-master-extension-0.4.1\`
- **Новый пакет:** `D:\Alex\Soft Development2\Product_Factory\Project Master\vscode-extension\project-master-extension-0.4.1.vsix`
- **Исходники:** `D:\Alex\Soft Development2\Product_Factory\Project Master\vscode-extension\`

## 🆘 **Если проблемы остаются**

1. **Полностью закройте Cursor IDE**
2. **Удалите папку:** `c:\Users\user\.cursor\extensions\project-master.project-master-extension-0.4.1\`
3. **Перезапустите Cursor**
4. **Установите заново из VSIX**

## ✅ **Критерии успеха**

- ✅ Нет ошибок `command already exists`
- ✅ Нет ошибок `401 Unauthorized`  
- ✅ Панели Project Master отображают данные
- ✅ Команды расширения работают
- ✅ Проекты загружаются корректно

---

**Автор:** AI Assistant  
**Дата:** 22.12.2024  
**Статус:** Готов к установке 