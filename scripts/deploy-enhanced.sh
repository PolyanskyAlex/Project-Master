#!/bin/bash

# Enhanced deployment script for CI/CD pipeline
# Usage: ./deploy-enhanced.sh [dev|staging|production] [backend_image] [frontend_image]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "Deployment failed with exit code $exit_code"
        error "Check log file: $LOG_FILE"
        
        # Send failure notification
        send_notification "❌ Deployment to $ENVIRONMENT failed!" "error"
    fi
    exit $exit_code
}

trap cleanup EXIT

# Notification function
send_notification() {
    local message="$1"
    local type="${2:-info}"
    
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$message" \
            -d "parse_mode=HTML" > /dev/null || true
    fi
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="#36a64f"
        [ "$type" = "error" ] && color="#ff0000"
        [ "$type" = "warning" ] && color="#ffaa00"
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" > /dev/null || true
    fi
}

# Health check function
health_check() {
    local url="$1"
    local max_attempts="${2:-30}"
    local wait_time="${3:-10}"
    
    log "Performing health check on $url"
    
    for i in $(seq 1 $max_attempts); do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            success "Health check passed on attempt $i"
            return 0
        fi
        
        if [ $i -lt $max_attempts ]; then
            warning "Health check attempt $i/$max_attempts failed, retrying in ${wait_time}s..."
            sleep $wait_time
        fi
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Smoke tests function
run_smoke_tests() {
    local base_url="$1"
    
    log "Running smoke tests against $base_url"
    
    # Test API endpoints
    local endpoints=(
        "/health"
        "/api/v1/projects"
        "/api/v1/functional-blocks"
        "/api/v1/tasks"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s -H "X-API-Key: ${API_KEY}" "$base_url$endpoint" > /dev/null 2>&1; then
            success "Smoke test passed: $endpoint"
        else
            error "Smoke test failed: $endpoint"
            return 1
        fi
    done
    
    success "All smoke tests passed"
}

# Database backup function
create_backup() {
    local environment="$1"
    
    if [ "$environment" = "production" ]; then
        log "Creating production backup..."
        
        local backup_dir="/backup/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Database backup
        docker exec postgres pg_dump -U project_user project_manager_db > "$backup_dir/database.sql"
        
        # Application files backup
        tar -czf "$backup_dir/application.tar.gz" /opt/project-manager
        
        success "Backup created in $backup_dir"
    fi
}

# Rollback function
rollback() {
    local environment="$1"
    
    error "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f docker-compose.prod.yml down
    
    # Restore from backup if available
    local latest_backup=$(ls -t /backup/ | head -n1)
    if [ -n "$latest_backup" ] && [ "$environment" = "production" ]; then
        warning "Restoring from backup: $latest_backup"
        
        # Restore database
        docker exec -i postgres psql -U project_user -d project_manager_db < "/backup/$latest_backup/database.sql"
        
        # Restore application
        tar -xzf "/backup/$latest_backup/application.tar.gz" -C /
    fi
    
    # Start previous version
    docker-compose -f docker-compose.prod.yml up -d
    
    error "Rollback completed"
    send_notification "🔄 Deployment rolled back to previous version" "warning"
}

# Main deployment function
deploy() {
    local environment="$1"
    local backend_image="${2:-}"
    local frontend_image="${3:-}"
    
    log "Starting deployment to $environment"
    log "Backend image: $backend_image"
    log "Frontend image: $frontend_image"
    
    # Validate inputs
    if [ -z "$backend_image" ] || [ -z "$frontend_image" ]; then
        error "Backend and frontend images must be specified"
        return 1
    fi
    
    # Check if images exist
    log "Validating Docker images..."
    if ! docker manifest inspect "$backend_image" > /dev/null 2>&1; then
        error "Backend image not found: $backend_image"
        return 1
    fi
    
    if ! docker manifest inspect "$frontend_image" > /dev/null 2>&1; then
        error "Frontend image not found: $frontend_image"
        return 1
    fi
    
    success "Docker images validated"
    
    # Create backup for production
    create_backup "$environment"
    
    # Set environment variables
    export BACKEND_IMAGE="$backend_image"
    export FRONTEND_IMAGE="$frontend_image"
    export ENVIRONMENT="$environment"
    
    # Pull latest images
    log "Pulling latest images..."
    docker pull "$backend_image"
    docker pull "$frontend_image"
    success "Images pulled successfully"
    
    # Deploy based on environment
    case "$environment" in
        "dev"|"development")
            log "Deploying to development environment..."
            docker-compose -f docker-compose.yml down || true
            docker-compose -f docker-compose.yml up -d
            local base_url="http://localhost:8080"
            ;;
        "staging")
            log "Deploying to staging environment..."
            docker-compose -f docker-compose.prod.yml down || true
            docker-compose -f docker-compose.prod.yml up -d
            local base_url="https://staging.example.com"
            ;;
        "production")
            log "Deploying to production environment..."
            
            # Rolling update strategy
            log "Performing rolling update..."
            docker-compose -f docker-compose.prod.yml up -d --no-deps backend
            sleep 30
            
            # Check backend health before updating frontend
            if ! health_check "https://example.com" 5 10; then
                rollback "$environment"
                return 1
            fi
            
            docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
            sleep 30
            
            local base_url="https://example.com"
            ;;
        *)
            error "Invalid environment: $environment"
            return 1
            ;;
    esac
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if ! health_check "$base_url"; then
        rollback "$environment"
        return 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$base_url"; then
        rollback "$environment"
        return 1
    fi
    
    # Clean up old images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Success notification
    success "Deployment to $environment completed successfully!"
    send_notification "✅ Deployment to $environment completed successfully!" "success"
    
    # Deployment summary
    log "=== Deployment Summary ==="
    log "Environment: $environment"
    log "Backend Image: $backend_image"
    log "Frontend Image: $frontend_image"
    log "URL: $base_url"
    log "Log File: $LOG_FILE"
    log "=========================="
}

# Main script
main() {
    # Check dependencies
    command -v docker >/dev/null 2>&1 || { error "Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose is required but not installed."; exit 1; }
    command -v curl >/dev/null 2>&1 || { error "curl is required but not installed."; exit 1; }
    
    # Parse arguments
    if [ $# -lt 1 ]; then
        error "Usage: $0 [dev|staging|production] [backend_image] [frontend_image]"
        error "Example: $0 staging ghcr.io/user/backend:latest ghcr.io/user/frontend:latest"
        exit 1
    fi
    
    local environment="$1"
    local backend_image="${2:-}"
    local frontend_image="${3:-}"
    
    # Load environment-specific configuration
    if [ -f "$PROJECT_ROOT/.env.$environment" ]; then
        log "Loading environment configuration: .env.$environment"
        set -a
        source "$PROJECT_ROOT/.env.$environment"
        set +a
    fi
    
    # Set defaults if not provided
    if [ -z "$backend_image" ] && [ -n "${DEFAULT_BACKEND_IMAGE:-}" ]; then
        backend_image="$DEFAULT_BACKEND_IMAGE"
    fi
    
    if [ -z "$frontend_image" ] && [ -n "${DEFAULT_FRONTEND_IMAGE:-}" ]; then
        frontend_image="$DEFAULT_FRONTEND_IMAGE"
    fi
    
    # Start deployment
    deploy "$environment" "$backend_image" "$frontend_image"
}

# Run main function with all arguments
main "$@" 