# ============================================================
# Nexfolio - Multi-stage Dockerfile (Laravel API + React SPA)
# Build context: repository root.
# Railway: Dockerfile Path = backend/Dockerfile, root = repo.
# ============================================================

# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Laravel backend ----------
FROM php:8.3-apache AS backend

# System deps + PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpng-dev \
        libzip-dev \
        libicu-dev \
        libxml2-dev \
        libcurl4-openssl-dev \
        libonig-dev \
        unzip \
        git \
        curl \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        gd \
        intl \
        bcmath \
        zip \
        xml \
        curl \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ENV COMPOSER_ALLOW_SUPERUSER=1

# Install PHP dependencies
# --no-scripts: avoid post-autoload-dump (php artisan package:discover) running
# before the application code is copied into the image.
COPY backend/composer.json backend/composer.lock ./
RUN php -d memory_limit=-1 /usr/bin/composer install --no-dev --no-scripts --optimize-autoloader

# Application code
COPY backend/ ./

# Register package service providers (Sanctum, Socialite, ...)
RUN php artisan package:discover --ansi || true

# Built SPA -> public/
COPY --from=frontend /app/frontend/dist ./public/

# Apache vhost (DocumentRoot = public, AllowOverride, index.php first)
COPY backend/deploy/apache.conf /etc/apache2/sites-available/nexfolio.conf
RUN a2dissite 000-default.conf || true \
    && a2ensite nexfolio.conf

# Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["sh", "-c", "php artisan storage:link || true; php artisan migrate --force || true; apache2-foreground"]
