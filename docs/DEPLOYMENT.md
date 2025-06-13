# Руководство по Развертыванию

## Обзор

Система управления проектами состоит из трех основных компонентов:
- **Backend**: Go-сервер с REST API
- **Frontend**: React-приложение с Material-UI
- **Database**: PostgreSQL база данных

Все компоненты контейнеризованы с помощью Docker и управляются через Docker Compose.

## Требования

### Системные требования
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM (минимум)
- 10GB свободного места на диске

### Поддерживаемые платформы
- Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+)
- macOS 10.15+
- Windows 10+ (с WSL2)

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd project-master
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
# Отредактируйте .env файл согласно вашим настройкам
```

### 3. Развертывание в режиме разработки
```bash
./scripts/deploy.sh dev deploy
```

### 4. Развертывание в продакшн режиме
```bash
./scripts/deploy.sh prod deploy
```

## Конфигурация

### Переменные окружения (.env)

#### Обязательные переменные
```env
# База данных
POSTGRES_DB=project_manager_db
POSTGRES_USER=project_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_PORT=5432

# API безопасность
API_KEY=your_secure_api_key_here

# Для продакшн режима
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com
```

#### Опциональные переменные
```env
# Backend конфигурация
SERVER_PORT=8080
GIN_MODE=release
LOG_LEVEL=info

# Frontend конфигурация
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENVIRONMENT=production
```

### Режимы развертывания

#### Development (dev)
- Порты напрямую экспонированы
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Database: localhost:5432
- Включены отладочные возможности

#### Production (prod)
- Использует reverse proxy (nginx/traefik)
- SSL сертификаты (Let's Encrypt)
- Внутренняя сеть контейнеров
- Оптимизированы для производительности

## Управление развертыванием

### Скрипт развертывания

Скрипт `scripts/deploy.sh` предоставляет следующие команды:

```bash
# Развертывание
./scripts/deploy.sh [dev|prod] deploy

# Остановка
./scripts/deploy.sh [dev|prod] stop

# Перезапуск
./scripts/deploy.sh [dev|prod] restart

# Просмотр логов
./scripts/deploy.sh [dev|prod] logs

# Проверка статуса
./scripts/deploy.sh [dev|prod] status
```

### Ручное управление

#### Запуск сервисов
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

#### Остановка сервисов
```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down
```

#### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### Перестроение образов
```bash
# Пересборка с кэшем
docker-compose build

# Пересборка без кэша
docker-compose build --no-cache
```

## Мониторинг и диагностика

### Health Checks

Все сервисы имеют встроенные health checks:

```bash
# Проверка состояния БД
docker-compose exec db pg_isready -U project_user -d project_manager_db

# Проверка backend
curl http://localhost:8080/health

# Проверка frontend
curl http://localhost:3000/
```

### Просмотр ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Информация о контейнерах
docker-compose ps
```

### Логи приложения
```bash
# Backend логи
docker-compose logs backend

# Frontend логи (nginx)
docker-compose logs frontend

# База данных логи
docker-compose logs db
```

## Резервное копирование

### Резервная копия базы данных
```bash
# Создание бэкапа
docker-compose exec db pg_dump -U project_user project_manager_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker-compose exec -T db psql -U project_user -d project_manager_db < backup_file.sql
```

### Резервная копия данных
```bash
# Создание архива volume
docker run --rm -v project_master_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Восстановление volume
docker run --rm -v project_master_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db_backup_file.tar.gz -C /data
```

## Обновление

### Обновление приложения
1. Остановите сервисы
2. Получите последние изменения из репозитория
3. Пересоберите образы
4. Запустите сервисы

```bash
./scripts/deploy.sh prod stop
git pull origin main
./scripts/deploy.sh prod deploy
```

### Миграции базы данных
```bash
# Выполнение миграций вручную
docker-compose exec backend ./main migrate

# Откат миграций
docker-compose exec backend ./main migrate-down
```

## Безопасность

### Рекомендации для продакшена
1. **Смените пароли по умолчанию**
2. **Используйте сильные API ключи**
3. **Настройте firewall** (только необходимые порты)
4. **Включите SSL/TLS** для всех соединений
5. **Регулярно обновляйте** образы контейнеров
6. **Ограничьте доступ** к Docker daemon
7. **Используйте secrets** для чувствительных данных

### Настройка SSL
```bash
# Создание директории для сертификатов
mkdir -p ./ssl

# Размещение сертификатов
cp your-cert.pem ./ssl/
cp your-key.pem ./ssl/
```

## Устранение неисправностей

### Частые проблемы

#### Контейнер не запускается
```bash
# Проверка логов
docker-compose logs [service-name]

# Проверка конфигурации
docker-compose config
```

#### База данных недоступна
```bash
# Проверка состояния БД
docker-compose exec db pg_isready -U project_user

# Перезапуск БД
docker-compose restart db
```

#### Порты заняты
```bash
# Проверка занятых портов
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432

# Остановка конфликтующих сервисов
sudo lsof -ti:3000 | xargs kill -9
```

#### Нехватка места на диске
```bash
# Очистка неиспользуемых образов
docker system prune -f

# Очистка volumes
docker volume prune -f

# Полная очистка
docker system prune -a -f
```

## Масштабирование

### Горизонтальное масштабирование
```bash
# Запуск нескольких инстансов backend
docker-compose up -d --scale backend=3
```

### Вертикальное масштабирование
Отредактируйте docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

## Поддержка

### Логи для отладки
При обращении в поддержку приложите:
1. **Логи сервисов**: `docker-compose logs`
2. **Конфигурацию**: `docker-compose config`
3. **Статус контейнеров**: `docker-compose ps`
4. **Системную информацию**: `docker version`, `docker-compose version`

### Полезные команды
```bash
# Полная переустановка
docker-compose down -v --remove-orphans
docker system prune -a -f
./scripts/deploy.sh [mode] deploy

# Проверка сетевого соединения
docker-compose exec backend ping db
docker-compose exec frontend ping backend
``` 