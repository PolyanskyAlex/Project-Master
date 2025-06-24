# Solution Architecture Document (SAD) - Project Master

## Обзор системы

Project Master — это комплексная система управления проектами с микросервисной архитектурой, включающая backend API (Go), frontend SPA (React), VSCode расширение и функционал выполнения задач агентом через интеграцию с Cursor IDE.

## Архитектура решения

### Высокоуровневая диаграмма системы

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROJECT MASTER ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   WEB UI    │    │   VS CODE   │    │   CURSOR    │                  │
│  │  (React)    │    │ EXTENSION   │    │    IDE      │                  │
│  │             │    │             │    │             │                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │
│         │                  │                  │                         │
│         │ HTTP/WS          │ HTTP/API         │ MCP/Commands             │
│         │                  │                  │                         │
│         ▼                  ▼                  ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    BACKEND SERVICES                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │   API GW    │  │    CORE     │  │    TASK     │                │ │
│  │  │  (Nginx)    │  │  SERVICE    │  │ EXECUTION   │                │ │
│  │  │             │  │   (Go)      │  │  SERVICE    │                │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │ │
│  │         │                │                │                        │ │
│  │         └────────────────┼────────────────┘                        │ │
│  │                          ▼                                         │ │
│  │                 ┌─────────────┐                                    │ │
│  │                 │ PostgreSQL  │                                    │ │
│  │                 │  Database   │                                    │ │
│  │                 └─────────────┘                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    INFRASTRUCTURE                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │   DOCKER    │  │  MONITORING │  │   LOGGING   │                │ │
│  │  │  COMPOSE    │  │ (Prometheus)│  │ (Grafana)   │                │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Структура каталогов

```
Project Master/
├── backend/                    # Go API сервис
│   ├── config/                 # Конфигурация
│   ├── database/               # Миграции БД
│   ├── handlers/               # HTTP обработчики
│   ├── models/                 # Модели данных
│   ├── repositories/           # Слой доступа к данным
│   ├── services/               # Бизнес-логика
│   ├── router/                 # Маршрутизация
│   └── utils/                  # Утилиты
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # React компоненты
│   │   ├── services/           # API сервисы
│   │   ├── hooks/              # React hooks
│   │   ├── pages/              # Страницы приложения
│   │   └── types/              # TypeScript типы
│   └── public/                 # Статические ресурсы
├── vscode-extension/           # VSCode расширение
│   ├── src/
│   │   ├── commands/           # VSCode команды
│   │   ├── providers/          # Tree view провайдеры
│   │   ├── services/           # Сервисы расширения
│   │   └── types/              # TypeScript типы
│   └── package.json            # Манифест расширения
├── tasks/                      # Система задач
│   ├── T-EXEC-001/             # Задачи выполнения
│   ├── T-EXEC-002/             # Система кнопок
│   ├── T-EXEC-003/             # Интеграция комментариев
│   ├── T-EXEC-004/             # Тестирование
│   └── T-EXEC-005/             # Развертывание
├── monitoring/                 # Мониторинг
│   ├── prometheus/             # Конфигурация Prometheus
│   └── grafana/                # Dashboards Grafana
├── docs/                       # Документация
└── scripts/                    # Скрипты развертывания
```

## Логическая архитектура

### Диаграмма компонентов

```
┌────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │    React    │  │   VSCode    │  │   Cursor    │                     │
│  │  Frontend   │  │ Extension   │  │Integration  │                     │
│  │             │  │             │  │             │                     │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                     │
│  │ │TaskTable│ │  │ │TaskTree │ │  │ │TaskExec │ │                     │
│  │ │TaskForm │ │  │ │Commands │ │  │ │Commands │ │                     │
│  │ │Projects │ │  │ │StatusBar│ │  │ │Polling  │ │                     │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└────────────────────┬───────────────────┬───────────────────┬───────────┘
                     │                   │                   │
                     ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   REST API  │  │  WebSocket  │  │    MCP      │                     │
│  │  Handlers   │  │  Handlers   │  │  Protocol   │                     │
│  │             │  │             │  │             │                     │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                     │
│  │ │Projects │ │  │ │RealTime │ │  │ │Commands │ │                     │
│  │ │Tasks    │ │  │ │Updates  │ │  │ │Execution│ │                     │
│  │ │Comments │ │  │ │Status   │ │  │ │Results  │ │                     │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└────────────────────┬───────────────────┬───────────────────┬───────────┘
                     │                   │                   │
                     ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BUSINESS LAYER                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │  Project    │  │    Task     │  │  Comment    │                     │
│  │  Service    │  │  Service    │  │  Service    │                     │
│  │             │  │             │  │             │                     │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                     │
│  │ │CRUD Ops │ │  │ │Search   │ │  │ │Logging  │ │                     │
│  │ │Validation│ │  │ │Execute  │ │  │ │Tracking │ │                     │
│  │ │Business │ │  │ │Status   │ │  │ │History  │ │                     │
│  │ │Rules    │ │  │ │Strategy │ │  │ │         │ │                     │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└────────────────────┬───────────────────┬───────────────────┬───────────┘
                     │                   │                   │
                     ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │  Project    │  │    Task     │  │  Comment    │                     │
│  │ Repository  │  │ Repository  │  │ Repository  │                     │
│  │             │  │             │  │             │                     │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                     │
│  │ │SQL      │ │  │ │SQL      │ │  │ │SQL      │ │                     │
│  │ │Queries  │ │  │ │Queries  │ │  │ │Queries  │ │                     │
│  │ │ORM      │ │  │ │Search   │ │  │ │Relations│ │                     │
│  │ │Mapping  │ │  │ │Indexing │ │  │ │Joins    │ │                     │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└────────────────────┬───────────────────┬───────────────────┬───────────┘
                     │                   │                   │
                     ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE LAYER                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                        ┌─────────────┐                                 │
│                        │ PostgreSQL  │                                 │
│                        │  Database   │                                 │
│                        │             │                                 │
│                        │ ┌─────────┐ │                                 │
│                        │ │Tables   │ │                                 │
│                        │ │Indexes  │ │                                 │
│                        │ │Relations│ │                                 │
│                        │ │ACID     │ │                                 │
│                        │ └─────────┘ │                                 │
│                        └─────────────┘                                 │
└────────────────────────────────────────────────────────────────────────┘
```

## Физическая архитектура

### Описание инфраструктуры

Система развертывается в контейнеризованной среде Docker с использованием Docker Compose для оркестрации. Все сервисы изолированы в отдельных контейнерах с настроенной сетевой связностью.

### Диаграмма развертывания

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTION ENVIRONMENT                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   NGINX     │  │   DOCKER    │  │  MONITORING │                     │
│  │ Load Balancer│  │   SWARM     │  │   STACK     │                     │
│  │             │  │             │  │             │                     │
│  │ Port: 80    │  │ Orchestrator│  │ Prometheus  │                     │
│  │ Port: 443   │  │             │  │ Grafana     │                     │
│  └──────┬──────┘  └─────────────┘  │ AlertMgr    │                     │
│         │                          └─────────────┘                     │
│         ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        APPLICATION TIER                            │ │
│  │                                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │  FRONTEND   │  │   BACKEND   │  │  EXTENSION  │                 │ │
│  │  │ Container   │  │  Container  │  │   VSIX      │                 │ │
│  │  │             │  │             │  │             │                 │ │
│  │  │ React App   │  │ Go Service  │  │ Distributed │                 │ │
│  │  │ Nginx       │  │ Port: 8080  │  │ via VSCode  │                 │ │
│  │  │ Port: 3000  │  │ Health: /   │  │ Marketplace │                 │ │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘                 │ │
│  │                          │                                         │ │
│  └──────────────────────────┼─────────────────────────────────────────┘ │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA TIER                                  │ │
│  │                                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │ PostgreSQL  │  │   REDIS     │  │   BACKUP    │                 │ │
│  │  │  Primary    │  │   Cache     │  │   Storage   │                 │ │
│  │  │             │  │             │  │             │                 │ │
│  │  │ Port: 5432  │  │ Port: 6379  │  │ S3/MinIO    │                 │ │
│  │  │ Volume:     │  │ Memory:     │  │ Automated   │                 │ │
│  │  │ Persistent  │  │ Volatile    │  │ Daily       │                 │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                       NETWORK LAYER                                │ │
│  │                                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │   BRIDGE    │  │   OVERLAY   │  │   EXTERNAL  │                 │ │
│  │  │  Network    │  │   Network   │  │   Network   │                 │ │
│  │  │             │  │             │  │             │                 │ │
│  │  │ Internal    │  │ Multi-Host  │  │ Internet    │                 │ │
│  │  │ Services    │  │ Services    │  │ Access      │                 │ │
│  │  │ 172.20.0.0  │  │ 10.0.0.0    │  │ Public IP   │                 │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Платформа хостинга

**Название платформы:** Docker + Cloud Provider (AWS/GCP/Azure)

**Обоснование выбора:**
- Контейнеризация обеспечивает консистентность между средами
- Простое масштабирование горизонтально и вертикально
- Изоляция сервисов и управление зависимостями
- Поддержка CI/CD pipeline
- Экономичность ресурсов

**Модель развертывания:** Hybrid Cloud
- Production: Cloud Provider с managed services
- Development: Local Docker Compose
- Testing: Cloud staging environment

## Стек технологий

### Backend
- **Язык:** Go 1.21+
- **Фреймворк:** Gin/Echo HTTP router
- **База данных:** PostgreSQL 15+
- **ORM:** GORM
- **Кэширование:** Redis
- **Контейнеризация:** Docker

### Frontend
- **Язык:** TypeScript 5+
- **Фреймворк:** React 18+
- **Сборщик:** Vite
- **UI библиотека:** Material-UI/Ant Design
- **Состояние:** React Context/Zustand
- **HTTP клиент:** Axios

### VSCode Extension
- **Язык:** TypeScript 5+
- **API:** VSCode Extension API
- **Сборка:** Webpack
- **Тестирование:** Jest + VSCode Test Runner

### DevOps
- **Контейнеризация:** Docker + Docker Compose
- **Мониторинг:** Prometheus + Grafana
- **Логирование:** ELK Stack / Loki
- **CI/CD:** GitHub Actions
- **Реестр:** Docker Hub / ECR

## Принципы проектирования

### Архитектурные принципы

1. **Разделение ответственности (SoC)**
   - Четкое разделение слоев: Presentation, Application, Business, Data
   - Изоляция бизнес-логики от технических деталей

2. **Инверсия зависимостей (DIP)**
   - Использование интерфейсов для абстракции
   - Dependency Injection для слабой связанности

3. **Единственная ответственность (SRP)**
   - Каждый модуль отвечает за одну функциональность
   - Микросервисная архитектура

4. **Открытость/Закрытость (OCP)**
   - Расширяемость через интерфейсы
   - Минимальные изменения существующего кода

5. **Принцип замещения Лисков (LSP)**
   - Совместимость реализаций интерфейсов
   - Полиморфизм в стратегиях выполнения задач

### Паттерны проектирования

- **Repository Pattern** - абстракция доступа к данным
- **Service Layer Pattern** - инкапсуляция бизнес-логики
- **Strategy Pattern** - различные стратегии выполнения задач
- **Observer Pattern** - уведомления об изменениях
- **Command Pattern** - выполнение задач агентом

## Модели данных

### Основные сущности

```sql
-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    content TEXT NOT NULL,
    author VARCHAR(255),
    comment_type VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Functional Blocks
CREATE TABLE functional_blocks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cursor Commands (новая таблица для выполнения задач)
CREATE TABLE cursor_commands (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    command_type VARCHAR(50) NOT NULL,
    command_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP
);
```

## Качественные атрибуты

### Безопасность

**Модель угроз:**
- **Injection attacks** - SQL injection, XSS, CSRF
- **Authentication bypass** - слабые пароли, session hijacking
- **Authorization flaws** - privilege escalation, IDOR
- **Data exposure** - sensitive data leakage, logging secrets

**Механизмы защиты:**
- Input validation и sanitization
- Parameterized queries (защита от SQL injection)
- JWT токены с коротким TTL
- HTTPS/TLS encryption
- Rate limiting и DDoS protection
- Security headers (CSP, HSTS, X-Frame-Options)
- Regular security audits и penetration testing

### Масштабируемость

**Стратегии масштабирования:**

**Горизонтальное масштабирование:**
- Stateless backend сервисы
- Load balancing с Nginx/HAProxy
- Database sharding по проектам
- Redis cluster для кэширования

**Вертикальное масштабирование:**
- Auto-scaling в cloud environment
- Resource monitoring и alerts
- Performance profiling и optimization

**Кэширование:**
- Redis для session storage
- Application-level caching
- CDN для статических ресурсов
- Database query optimization

### Отказоустойчивость

**Механизмы отказоустойчивости:**

**Database resilience:**
- PostgreSQL streaming replication
- Automated failover с Patroni
- Point-in-time recovery (PITR)
- Regular backup testing

**Application resilience:**
- Health checks для всех сервисов
- Circuit breaker pattern
- Retry mechanisms с exponential backoff
- Graceful degradation

**Infrastructure resilience:**
- Multi-AZ deployment
- Container orchestration с Docker Swarm/Kubernetes
- Monitoring и alerting
- Disaster recovery procedures

### Управление секретами

**Инструмент:** HashiCorp Vault / AWS Secrets Manager

**Политика безопасности:**
Категорически запрещено хранить секреты в исходном коде. Все API ключи, пароли, токены и другие чувствительные данные должны храниться в специализированных системах управления секретами.

**Локальная разработка:**
Для локальной разработки использовать файл `.env` (добавлен в .gitignore) с переменными окружения. Никогда не коммитить реальные production секреты.

**Production deployment:**
- Секреты инжектируются через environment variables
- Ротация секретов каждые 90 дней
- Audit logging доступа к секретам
- Принцип минимальных привилегий

## API контракты

### REST API Endpoints

```yaml
# Projects API
GET    /api/v1/projects          # Список проектов
POST   /api/v1/projects          # Создание проекта
GET    /api/v1/projects/{id}     # Получение проекта
PUT    /api/v1/projects/{id}     # Обновление проекта
DELETE /api/v1/projects/{id}     # Удаление проекта

# Tasks API
GET    /api/v1/tasks             # Список задач
POST   /api/v1/tasks             # Создание задачи
GET    /api/v1/tasks/{id}        # Получение задачи
PUT    /api/v1/tasks/{id}        # Обновление задачи
DELETE /api/v1/tasks/{id}        # Удаление задачи

# Task Execution API (новый функционал)
POST   /api/v1/cursor-commands   # Создание команды выполнения
GET    /api/v1/cursor-commands/pending  # Получение ожидающих команд
PUT    /api/v1/cursor-commands/{id}     # Обновление статуса команды

# Comments API
GET    /api/v1/tasks/{id}/comments      # Комментарии задачи
POST   /api/v1/tasks/{id}/comments      # Добавление комментария

# WebSocket API
WS     /ws/task-execution        # Real-time обновления выполнения задач
WS     /ws/notifications         # Общие уведомления системы
```

### VSCode Extension API

```typescript
// Команды расширения
projectMaster.executeTask        // Выполнение задачи агентом
projectMaster.projectSelected    // Выбор проекта
projectMaster.refreshTasks       // Обновление списка задач
projectMaster.openTaskDetails    // Открытие деталей задачи

// Tree View провайдеры
ProjectsProvider                 // Дерево проектов
TasksProvider                   // Дерево задач
PlanProvider                    // Планы проектов

// Сервисы
ApiService                      // HTTP API клиент
CachedApiService               // Кэшированный API
TaskExecutionService           // Выполнение задач
CommandPollingService          // Опрос команд
```

## Заключение

Архитектура Project Master спроектирована с учетом современных принципов разработки, обеспечивая масштабируемость, безопасность и отказоустойчивость. Микросервисная архитектура позволяет независимо развивать и развертывать компоненты системы, а контейнеризация обеспечивает консистентность между средами разработки и production.

Новый функционал выполнения задач агентом интегрируется в существующую архитектуру через расширение API и добавление новых сервисов, сохраняя принципы разделения ответственности и слабой связанности компонентов. 