# Многоэтапная сборка для Go-бэкенда
FROM golang:1.24-alpine AS builder

# Установка зависимостей для сборки
RUN apk add --no-cache git ca-certificates tzdata

# Рабочая директория
WORKDIR /app

# Копирование файлов модуля
COPY go.mod go.sum ./

# Загрузка зависимостей
RUN go mod download

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Финальный образ
FROM alpine:latest

# Установка ca-certificates для HTTPS запросов
RUN apk --no-cache add ca-certificates tzdata

# Создание пользователя для запуска приложения
RUN adduser -D -s /bin/sh appuser

WORKDIR /root/

# Копирование скомпилированного приложения
COPY --from=builder /app/main .

# Создание директории для логов и изменение владельца
RUN mkdir -p /var/log/app && chown -R appuser:appuser /var/log/app

# Переключение на непривилегированного пользователя
USER appuser

# Открытие порта
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Запуск приложения
CMD ["./main"] 