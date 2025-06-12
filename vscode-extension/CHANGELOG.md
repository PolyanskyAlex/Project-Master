# Change Log

All notable changes to the "Project Master" extension will be documented in this file.

## [0.3.0] - 2024-12-19

### ✨ Major Features
- **Enhanced Tree View Navigation**: Полностью переработанная навигация с иерархическим отображением
- **Project-Centric Workflow**: Выбор проекта для фильтрации задач и плана разработки
- **Improved User Experience**: Интуитивный интерфейс с цветовой индикацией и иконками

### 🌳 Tree View Improvements
- **Projects View**: 
  - Группировка проектов по функциональным блокам
  - Отображение проектов без функциональных блоков
  - Выбор активного проекта одним кликом
  - Цветовая индикация статусов (Active, Completed, On Hold, Cancelled)
  
- **Tasks View**:
  - Группировка задач по статусам с автоматическим скрытием пустых групп
  - Фильтрация задач по выбранному проекту
  - Улучшенные иконки для типов задач (Feature, Bug, Improvement, Documentation, Test)
  - Цветовая индикация приоритетов (Critical, High, Medium, Low)
  
- **Development Plan View**:
  - Отображение упорядоченного плана для выбранного проекта
  - Нумерация задач в порядке выполнения
  - Синхронизация плана с прогресс-индикатором
  - Быстрый переход к задачам из плана

### 🔧 Enhanced Commands
- **Project Management**:
  - `Project Master: Select Project` - Выбор активного проекта
  - `Project Master: Create New Project` - Создание проекта с выбором функционального блока
  - `Project Master: Refresh Projects` - Обновление списка проектов
  
- **Task Management**:
  - `Project Master: Create New Task` - Создание задачи с валидацией и выбором параметров
  - `Project Master: Refresh Tasks` - Обновление списка задач
  - `Project Master: Open Task` - Просмотр задачи в markdown формате
  
- **Development Plan**:
  - `Project Master: Sync Development Plan` - Синхронизация плана с прогресс-индикатором

### 🎨 UI/UX Improvements
- **Dynamic Tree View Titles**: Заголовки обновляются при выборе проекта
- **Context Menus**: Контекстные меню для быстрых действий
- **Toolbar Actions**: Кнопки действий в заголовках Tree View
- **Progress Indicators**: Индикаторы прогресса для длительных операций
- **Validation**: Валидация ввода с понятными сообщениями об ошибках

### 🔄 Data Management
- **Smart Filtering**: Автоматическая фильтрация данных по выбранному проекту
- **Parallel Loading**: Параллельная загрузка проектов и функциональных блоков
- **Error Handling**: Улучшенная обработка ошибок с предложениями решений
- **Auto-refresh**: Настраиваемое автообновление данных

### 📱 Integration Features
- **Project Selection Events**: Синхронизация выбора проекта между всеми провайдерами
- **Cross-View Navigation**: Переходы между разными представлениями
- **Status Synchronization**: Синхронизация статусов между компонентами

### 🛠️ Technical Improvements
- **TypeScript Enhancements**: Улучшенная типизация для всех компонентов
- **Provider Architecture**: Модульная архитектура провайдеров данных
- **Command System**: Централизованная система команд с зависимостями
- **Error Recovery**: Автоматическое восстановление после ошибок

### 🐛 Bug Fixes
- Исправлена проблема с отображением пустых списков
- Улучшена стабильность при потере соединения с API
- Исправлены ошибки типизации в провайдерах
- Оптимизирована производительность загрузки данных

### 📚 Documentation
- Обновлен README с подробным описанием новых возможностей
- Добавлены примеры использования Tree View
- Документация по устранению неполадок
- Руководство по настройке и конфигурации

## [0.2.0] - 2024-12-19

### ✨ New Features
- **Setup Wizard**: Пошаговый мастер настройки подключения к API
- **Quick Setup**: Быстрая настройка с предустановленными сценариями
- **Connection Testing**: Проверка подключения к API с детальной диагностикой
- **Status Bar Integration**: Индикатор статуса подключения в реальном времени

### 🔧 Setup & Configuration
- **Setup Wizard**: Интерактивный мастер с валидацией на каждом шаге
- **Quick Setup Options**:
  - Local Development (localhost:8080 API, localhost:3000 Web)
  - Production Server (custom URLs with API key)
  - Custom Setup (manual configuration)
- **Configuration Validator**: Автоматическая валидация настроек с предупреждениями
- **Test Connection**: Проверка доступности API с индикаторами прогресса

### 📊 Status Bar Provider
- **Real-time Status**: Отображение текущего статуса подключения
- **Status Indicators**:
  - ✅ Connected (зеленый) - успешное подключение
  - ❌ Error (красный) - ошибка подключения
  - ⚠️ Warning (желтый) - предупреждения конфигурации
- **Quick Actions Menu**: Быстрый доступ к настройкам и действиям
- **Auto-refresh**: Автоматическое обновление статуса каждые 30 секунд

### 🛠️ Enhanced Commands
- `Project Master: Setup Wizard` - Запуск мастера настройки
- `Project Master: Quick Setup` - Быстрая настройка
- `Project Master: Test Connection` - Проверка подключения
- `Project Master: Show Status` - Показать меню статуса

### 🔍 Configuration Validation
- **URL Validation**: Проверка корректности API и Web URL
- **Protocol Validation**: Поддержка HTTP/HTTPS с предупреждениями
- **API Key Validation**: Проверка наличия и формата API ключа
- **Environment Detection**: Автоматическое определение production/development
- **Comprehensive Reporting**: Детальные отчеты о состоянии конфигурации

### 📚 Documentation Updates
- Обновлен README с инструкциями по настройке
- Добавлены примеры конфигурации для разных сценариев
- Документация по устранению неполадок
- Описание всех доступных команд и настроек

## [0.1.0] - 2024-12-19

### ✨ Initial Release
- **Basic Extension Structure**: Базовая структура VS Code расширения
- **Tree Data Providers**: Провайдеры для Projects, Tasks, и Development Plan
- **API Integration**: Интеграция с Project Master API
- **Configuration Service**: Сервис управления настройками
- **Logging System**: Система логирования с уровнями

### 🌳 Tree Views
- **Projects View**: Отображение списка проектов
- **Tasks View**: Группировка задач по статусам
- **Development Plan View**: Отображение плана разработки

### 🔧 Core Features
- **Project Management**: Просмотр и создание проектов
- **Task Management**: Создание и просмотр задач
- **Comments**: Добавление комментариев к задачам
- **Web UI Integration**: Быстрый доступ к веб-интерфейсу

### ⚙️ Configuration
- **API Settings**: Настройка URL API и ключа
- **Web URL**: Настройка URL веб-интерфейса
- **Auto-refresh**: Автоматическое обновление данных
- **Logging**: Настраиваемый уровень логирования

### 🛠️ Technical Foundation
- **TypeScript**: Полная типизация кода
- **ESLint**: Настроенный линтер для качества кода
- **Modular Architecture**: Модульная архитектура с разделением ответственности
- **Error Handling**: Базовая обработка ошибок

### Configuration Options
- `projectMaster.apiUrl`: API base URL
- `projectMaster.apiKey`: Authentication key
- `projectMaster.webUrl`: Web interface URL
- `projectMaster.autoRefresh`: Enable auto-refresh
- `projectMaster.refreshInterval`: Refresh interval in ms
- `projectMaster.defaultProject`: Default project for new tasks
- `projectMaster.enableNotifications`: Enable notifications
- `projectMaster.logLevel`: Logging level

### Commands
- `projectMaster.refreshProjects`: Refresh project data
- `projectMaster.createProject`: Create new project
- `projectMaster.createTask`: Create new task
- `projectMaster.openTask`: Open task details
- `projectMaster.openWebUI`: Open web interface
- `projectMaster.syncPlan`: Sync development plan
- `projectMaster.selectProject`: Select project (internal)

### Known Issues
- None at initial release

### Dependencies
- axios: ^1.6.0
- @types/vscode: ^1.74.0
- TypeScript: ^4.9.4

---

## Future Releases

### Planned Features
- Task editing capabilities
- Drag and drop for development plan reordering
- Offline mode support
- Task templates
- Bulk operations
- Advanced filtering and search
- Integration with VS Code tasks
- Git integration
- Time tracking
- Notifications and reminders
- Custom themes and icons
- Export functionality
- Keyboard shortcuts
- Multi-workspace support 