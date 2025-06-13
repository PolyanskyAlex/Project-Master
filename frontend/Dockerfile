# Многоэтапная сборка для React-фронтенда
FROM node:18-alpine AS builder

# Рабочая директория
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production --silent

# Копирование исходного кода
COPY . .

# Сборка приложения для продакшена
RUN npm run build

# Финальный образ с nginx
FROM nginx:alpine

# Копирование nginx конфигурации
COPY nginx.conf /etc/nginx/nginx.conf

# Копирование собранного приложения
COPY --from=builder /app/build /usr/share/nginx/html

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx

# Переключение на непривилегированного пользователя
USER nginx-user

# Открытие порта
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"] 