#!/bin/bash

# Скрипт развертывания системы управления проектами
# Версия: 1.0.0

set -e  # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен. Установите Docker перед развертыванием."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен. Установите Docker Compose перед развертыванием."
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка переменных окружения
check_env() {
    log_info "Проверка переменных окружения..."
    
    if [ ! -f .env ]; then
        log_warning ".env файл не найден. Создание из .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            log_warning "Отредактируйте .env файл перед развертыванием"
        else
            log_error ".env.example файл не найден"
            exit 1
        fi
    fi
    
    # Загрузка переменных окружения
    source .env
    
    # Проверка обязательных переменных
    required_vars=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "API_KEY")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Переменная $var не установлена в .env файле"
            exit 1
        fi
    done
    
    log_success "Переменные окружения настроены корректно"
}

# Очистка предыдущих контейнеров
cleanup() {
    log_info "Очистка предыдущих контейнеров..."
    
    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    else
        docker-compose down --remove-orphans 2>/dev/null || true
    fi
    
    # Удаление неиспользуемых образов
    docker image prune -f 2>/dev/null || true
    
    log_success "Очистка завершена"
}

# Сборка образов
build_images() {
    log_info "Сборка Docker образов..."
    
    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    log_success "Образы собраны успешно"
}

# Запуск сервисов
start_services() {
    log_info "Запуск сервисов..."
    
    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    log_success "Сервисы запущены"
}

# Проверка состояния сервисов
check_health() {
    log_info "Проверка состояния сервисов..."
    
    # Ожидание запуска БД
    log_info "Ожидание запуска базы данных..."
    for i in {1..30}; do
        if [ "$1" = "prod" ]; then
            if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB &>/dev/null; then
                break
            fi
        else
            if docker-compose exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB &>/dev/null; then
                break
            fi
        fi
        
        if [ $i -eq 30 ]; then
            log_error "База данных не запустилась за 30 попыток"
            exit 1
        fi
        
        sleep 2
    done
    
    log_success "База данных готова"
    
    # Ожидание запуска Backend
    log_info "Ожидание запуска backend..."
    for i in {1..30}; do
        if curl -f http://localhost:8080/health &>/dev/null; then
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "Backend не запустился за 30 попыток"
            exit 1
        fi
        
        sleep 2
    done
    
    log_success "Backend готов"
    
    # Проверка Frontend
    log_info "Проверка frontend..."
    frontend_port=3000
    if [ "$1" = "prod" ]; then
        frontend_port=80
    fi
    
    for i in {1..20}; do
        if curl -f http://localhost:$frontend_port &>/dev/null; then
            break
        fi
        
        if [ $i -eq 20 ]; then
            log_error "Frontend не запустился за 20 попыток"
            exit 1
        fi
        
        sleep 2
    done
    
    log_success "Frontend готов"
}

# Показать статус
show_status() {
    log_info "Статус сервисов:"
    
    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker-compose ps
    fi
    
    echo
    log_info "Приложение доступно по адресам:"
    
    if [ "$1" = "prod" ]; then
        echo "  Frontend: http://localhost"
        echo "  API: http://localhost/api"
    else
        echo "  Frontend: http://localhost:3000"
        echo "  Backend API: http://localhost:8080"
        echo "  Database: localhost:5432"
    fi
}

# Основная функция
main() {
    local mode=${1:-dev}
    local action=${2:-deploy}
    
    echo "================================================"
    echo "   Развертывание Системы Управления Проектами"
    echo "   Режим: $mode"
    echo "   Действие: $action"
    echo "================================================"
    echo
    
    case $action in
        "deploy")
            check_dependencies
            check_env
            cleanup $mode
            build_images $mode
            start_services $mode
            check_health $mode
            show_status $mode
            log_success "Развертывание завершено успешно!"
            ;;
        "stop")
            log_info "Остановка сервисов..."
            if [ "$mode" = "prod" ]; then
                docker-compose -f docker-compose.prod.yml down
            else
                docker-compose down
            fi
            log_success "Сервисы остановлены"
            ;;
        "restart")
            log_info "Перезапуск сервисов..."
            cleanup $mode
            start_services $mode
            check_health $mode
            show_status $mode
            log_success "Сервисы перезапущены"
            ;;
        "logs")
            if [ "$mode" = "prod" ]; then
                docker-compose -f docker-compose.prod.yml logs -f
            else
                docker-compose logs -f
            fi
            ;;
        "status")
            show_status $mode
            ;;
        *)
            echo "Использование: $0 [dev|prod] [deploy|stop|restart|logs|status]"
            echo
            echo "Примеры:"
            echo "  $0 dev deploy    - Развернуть в dev режиме"
            echo "  $0 prod deploy   - Развернуть в prod режиме"
            echo "  $0 dev stop      - Остановить dev сервисы"
            echo "  $0 prod logs     - Показать логи prod сервисов"
            echo "  $0 dev status    - Показать статус dev сервисов"
            exit 1
            ;;
    esac
}

# Запуск основной функции
main "$@" 