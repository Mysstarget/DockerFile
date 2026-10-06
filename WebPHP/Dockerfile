FROM php:8.3-apache

# Extensions PHP nécessaires pour MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Active le module rewrite d'Apache
RUN a2enmod rewrite

# Configuration du dossier web
WORKDIR /var/www/html

# Copie du site
COPY ./web/ /var/www/html/

# Permissions
RUN chown -R www-data:www-data /var/www/html
