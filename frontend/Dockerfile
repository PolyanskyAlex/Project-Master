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

# Создание необходимых директорий и установка прав
RUN mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run/nginx /var/log/nginx

# Открытие порта
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"] 