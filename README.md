# Система Управления Проектами

![Docker](https://img.shields.io/badge/Docker-20.10+-blue)
![Go](https://img.shields.io/badge/Go-1.21+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

Полнофункциональная система управления проектами для разработки ПО с интеграцией в IDE (Cursor/VS Code). Включает веб-интерфейс, Go-бэкенд, PostgreSQL и расширение для IDE.

## 🚀 Быстрый старт

### Автоматический запуск (рекомендуется)

```bash
# Windows - запуск всей системы
start_project_master.bat

# Остановка системы
stop_project_master.bat
```

### ⚡ Локальная разработка (БЕЗ Docker) - БЫСТРО!

Для быстрой разработки без ожидания сборки Docker контейнеров:

```bash
# Запуск локальной среды разработки
dev-start.bat
```

**Что запускается:**
- 🗄️ **PostgreSQL** (только БД в Docker)
- 🚀 **Go Backend** (localhost:8080) - нативно
- ⚛️ **React Frontend** (localhost:3000) - нативно с hot reload

**Быстрые команды для разработки:**
```bash
# Перезапуск только backend (3-5 сек)
dev-restart-backend.bat

# Перезапуск только frontend (3-5 сек)  
dev-restart-frontend.bat

# Просмотр логов backend
dev-logs-simple.bat
```

**Преимущества локальной разработки:**
- ⚡ **Мгновенная перезагрузка** - изменения применяются за секунды
- 🔧 **Hot Reload** - React автоматически обновляется при изменениях
- 🐛 **Легкая отладка** - прямой доступ к процессам Go и Node
- 📝 **Логи в реальном времени** - в отдельных окнах терминала

### Ручное развертывание

```bash
# Клонирование репозитория
git clone <repository-url>
cd project-master

# Запуск Docker контейнеров
docker-compose up -d

# Проверка работы
curl http://localhost:8080/health
```

### Установка VS Code расширения (ИСПРАВЛЕНО ✅)

1. Откройте **Cursor IDE**
2. Extensions (Ctrl+Shift+X)  
3. **"..."** → **"Install from VSIX"**
4. Выберите: `vscode-extension/project-master-extension-0.4.0.vsix`

**Доступные команды после установки:**
- 🔄 **Project Master: Sync Plan** - синхронизация плана разработки
- 📋 **Project Master: Refresh Projects** - обновление списка проектов

### Доступ к приложению

**Все режимы:**
- **Web UI:** http://localhost:3000
- **Backend API:** http://localhost:8080  
- **Health Check:** http://localhost:8080/health
- **Database:** localhost:5432

## 📋 Компоненты системы

### Backend (Go)
- **REST API** с полным CRUD функционалом
- **PostgreSQL** интеграция с миграциями
- **JWT аутентификация** и API ключи
- **Автоматическое логирование** операций
- **Health checks** и мониторинг

### Frontend (React + TypeScript)
- **Material-UI** компоненты
- **React Router** для навигации  
- **React Hook Form** для форм
- **Axios** для API запросов
- **Comprehensive testing** (Jest, RTL)

### Database (PostgreSQL)
- **8 таблиц** для полного функционала
- **Автоматические миграции**
- **Индексы** для производительности
- **Backup/restore** скрипты

### VS Code Extension
- **Tree View** навигация по проектам
- **CRUD операции** из IDE
- **MCP файлы** выполнение
- **Plan push** функционал
- **Кэширование** для производительности

## 🛠 Основные возможности

### Управление проектами
- ✅ Создание и управление проектами
- ✅ Функциональные блоки и категоризация
- ✅ Статусы проекта с визуальными индикаторами
- ✅ Интеграция с планом разработки

### Управление задачами
- ✅ Полный CRUD для задач
- ✅ Автоматическая нумерация (TASK-XXXXXX)
- ✅ Статусы, приоритеты, типы задач
- ✅ Комментарии и история изменений
- ✅ Фильтрация и поиск

### План разработки
- ✅ Drag-and-drop переупорядочивание
- ✅ Добавление задач в план
- ✅ Статистика выполнения
- ✅ Экспорт в различные форматы

### Документооборот
- ✅ Управление документами проекта
- ✅ Типы документов (BRD, SAD, Technical, etc.)
- ✅ Agent-editable флаги
- ✅ Фильтрация по проекту и типу

### Логирование и аудит
- ✅ Автоматическое логирование операций
- ✅ История изменений статусов
- ✅ Комментарии с временными метками
- ✅ Полный аудит действий

## 📦 Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code       │    │   React          │    │   Go Backend    │
│   Extension     │◄──►│   Frontend       │◄──►│   REST API      │
│                 │    │   (Port 3000)    │    │   (Port 8080)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                 │                        │
                                 │                        │
                                 ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Nginx Proxy    │    │   PostgreSQL    │
                       │   (Production)   │    │   Database      │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Технический стек

### Backend
- **Go 1.21+** - основной язык
- **Gin** - веб-фреймворк  
- **GORM** - ORM для базы данных
- **PostgreSQL** - база данных
- **Docker** - контейнеризация

### Frontend  
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Material-UI v5** - UI компоненты
- **React Router v6** - маршрутизация
- **Axios** - HTTP клиент
- **React Hook Form** - работа с формами

### Development Tools
- **Docker Compose** - оркестрация
- **Jest** - тестирование  
- **ESLint** - линтер
- **Prettier** - форматирование
- **VS Code** - IDE интеграция

## 📚 Документация

- [📖 Руководство по развертыванию](docs/DEPLOYMENT.md)
- [🧪 Отчет по тестированию](frontend/TESTING_REPORT.md)
- [🔌 VS Code Extension](vscode-extension/README.md)
- [⚙️ API документация](backend/docs/API.md)
- [🐛 Исправление CORS Policy Error](docs/BUGFIX_CORS_CACHE_CONTROL.md)
- [🐛 Исправление VS Code Extension](docs/BUGFIX_VSCODE_EXTENSION_COMMANDS.md)

## 📁 Файлы локальной разработки

- `dev-start.bat` - запуск полной среды разработки
- `dev-restart-backend.bat` - быстрый перезапуск Go backend
- `dev-restart-frontend.bat` - быстрый перезапуск React frontend  
- `dev-logs-simple.bat` - просмотр логов backend (интерактивно)
- `dev-logs.bat` - расширенный просмотр логов (с jq)
- `.env.local` - локальная конфигурация для разработки
- `start_project_master.bat` - запуск продакшн системы (Docker)
- `stop_project_master.bat` - остановка продакшн системы

## 🚀 Команды развертывания

### Основные команды
```bash
# Развертывание
./scripts/deploy.sh [dev|prod] deploy

# Остановка  
./scripts/deploy.sh [dev|prod] stop

# Перезапуск
./scripts/deploy.sh [dev|prod] restart

# Логи
./scripts/deploy.sh [dev|prod] logs

# Статус
./scripts/deploy.sh [dev|prod] status
```

### Docker команды
```bash
# Сборка образов
docker-compose build

# Запуск сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## ✅ Статус проекта

### Текущий прогресс: 27/27 задач завершено (100%)

#### ✅ Фаза 1: Инициализация и Настройка (100%)
- Go-проект и структура
- Docker Compose для PostgreSQL  
- Подключение к БД и миграции
- HTTP-сервер и роутер
- Базовая аутентификация

#### ✅ Фаза 2: Backend Development (100%)
- CRUD для всех сущностей
- Валидация и бизнес-логика
- Автоматическое логирование
- Plan management API
- Полное покрытие тестами

#### ✅ Фаза 3: Frontend Development (100%) 
- React приложение с TypeScript
- Material-UI интерфейс
- Все CRUD страницы
- Plan management с drag-and-drop
- Comprehensive testing suite

#### ✅ Фаза 4: VS Code Extension (100%)
- Tree View провайдеры
- CRUD команды
- MCP файлы поддержка  
- Plan push функционал
- Caching система

#### ✅ Фаза 5: Testing & Deployment (100%)
- Unit тесты для backend
- E2E тесты для API
- Frontend testing suite
- VS Code extension tests
- Docker deployment готов

## 🔐 Безопасность

- **API Key** аутентификация
- **Environment variables** для секретов
- **Docker security** best practices
- **CORS** настройки
- **Input validation** на всех уровнях

## 📈 Мониторинг и логирование

### 📋 Система логирования
- **Backend логи** - структурированные JSON логи в файлах
- **Frontend логи** - DevLogViewer в UI (кнопка 🐛)
- **Операционные логи** - в PostgreSQL (страница "Логи операций")
- **HTTP запросы** - автоматическое логирование всех API вызовов

### 📁 Файлы логов
- **Локальная разработка**: `backend/logs/app-YYYY-MM-DD.log`
- **Docker**: `/var/log/app/app-YYYY-MM-DD.log` (мапится в `./logs/`)
- **Автоочистка**: логи старше 7 дней удаляются автоматически
- **Ротация**: новый файл каждый день

### 🔍 Просмотр логов
```bash
# Интерактивный просмотр логов
dev-logs-simple.bat

# Последние 20 строк
powershell "Get-Content backend/logs/app-*.log -Tail 20"

# Поиск по логам
findstr "ERROR" backend/logs/app-*.log
```

### 📊 Уровни логирования
- **DEBUG** - отладочная информация (только в development)
- **INFO** - обычные операции и HTTP запросы
- **WARN** - предупреждения и нестандартные ситуации
- **ERROR** - ошибки приложения и API
- **FATAL** - критические ошибки (завершают приложение)

### 🎯 Мониторинг производительности
- **Health checks** для всех сервисов
- **Performance monitoring** в frontend
- **Error tracking** на всех уровнях
- **Resource usage** мониторинг

## 🤝 Разработка

### Требования для разработки
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (опционально, можно через Docker)

### Локальная разработка

**Быстрый способ (рекомендуется):**
```bash
# Автоматический запуск всей среды разработки
dev-start.bat

# Быстрые перезапуски отдельных компонентов
dev-restart-backend.bat    # Только Go backend
dev-restart-frontend.bat   # Только React frontend
```

**Ручной способ:**
```bash
# 1. База данных (Docker)
docker-compose up db -d

# 2. Backend (Go) - в отдельном терминале
cd backend
copy .env.local .env
go run main.go

# 3. Frontend (React) - в отдельном терминале
cd frontend
npm install
npm start
```

**Конфигурация для локальной разработки:**
- Файл `.env.local` содержит настройки для локальной среды
- Backend: http://localhost:8080
- Frontend: http://localhost:3000 (с hot reload)
- Database: localhost:5432 (PostgreSQL в Docker)

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 🐛 Отчеты об ошибках

Создайте issue в репозитории с подробным описанием проблемы, включая:
- Шаги для воспроизведения
- Ожидаемое поведение
- Фактическое поведение  
- Логи системы
- Информация об окружении

## 📞 Поддержка

- 📧 Email: [support@example.com](mailto:support@example.com)
- 💬 Issues: [GitHub Issues](../../issues)
- 📖 Wiki: [Project Wiki](../../wiki) 