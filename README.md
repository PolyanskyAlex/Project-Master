# Система Управления Проектами

![Docker](https://img.shields.io/badge/Docker-20.10+-blue)
![Go](https://img.shields.io/badge/Go-1.21+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

Полнофункциональная система управления проектами для разработки ПО с интеграцией в IDE (Cursor/VS Code). Включает веб-интерфейс, Go-бэкенд, PostgreSQL и расширение для IDE.

## 🚀 Быстрый старт

### Автоматическое развертывание

```bash
# Клонирование репозитория
git clone <repository-url>
cd project-master

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Развертывание в режиме разработки
./scripts/deploy.sh dev deploy

# Развертывание в продакшн режиме
./scripts/deploy.sh prod deploy
```

### Доступ к приложению

**Development режим:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

**Production режим:**
- Frontend: http://localhost
- API: http://localhost/api

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

## 📈 Мониторинг

- **Health checks** для всех сервисов
- **Logging** на всех уровнях
- **Performance monitoring**
- **Error tracking**
- **Resource usage** мониторинг

## 🤝 Разработка

### Требования для разработки
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (опционально, можно через Docker)

### Локальная разработка
```bash
# Backend
cd backend
go mod download
go run main.go

# Frontend  
cd frontend
npm install
npm start

# Database
docker-compose up db -d
```

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