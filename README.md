# Project Manager

Система управления проектами с Go-бэкендом, веб-интерфейсом и расширением для IDE.

## Требования

- Go 1.21+
- Docker и Docker Compose
- PostgreSQL (через Docker)

## Быстрый старт

### 1. Настройка окружения

```bash
# Скопировать файл конфигурации
cp .env.example .env

# Отредактировать .env файл при необходимости
```

### 2. Запуск базы данных

```bash
# Запустить PostgreSQL в Docker
docker-compose up -d db

# Проверить статус контейнера
docker-compose ps
```

### 3. Запуск бэкенда

```bash
cd backend
go run main.go
```

## Структура проекта

```
project-manager/
├── backend/                 # Go-бэкенд
│   ├── config/             # Конфигурация
│   ├── database/           # Подключение к БД и миграции
│   ├── models/             # Модели данных
│   ├── repositories/       # Слой доступа к данным
│   ├── services/           # Бизнес-логика
│   ├── handlers/           # HTTP обработчики
│   ├── router/             # Маршрутизация
│   ├── utils/              # Утилиты
│   └── main.go             # Точка входа
├── frontend/               # Веб-интерфейс (планируется)
├── ide-extension/          # Расширение для IDE (планируется)
├── docker-compose.yml      # Docker Compose конфигурация
├── .env                    # Переменные окружения
└── README.md               # Этот файл
```

## Конфигурация

Настройки хранятся в файле `.env`:

- `POSTGRES_DB` - имя базы данных
- `POSTGRES_USER` - пользователь БД
- `POSTGRES_PASSWORD` - пароль БД
- `POSTGRES_HOST` - хост БД
- `POSTGRES_PORT` - порт БД
- `API_KEY` - API ключ для аутентификации
- `SERVER_PORT` - порт HTTP сервера

## Разработка

Проект разрабатывается согласно плану в `tasks/dev_plan.md`.

Каждый коммит содержит номер задачи из плана разработки. 