# Image locale de développement : PHP 8.4 (Apache) avec pdo_mysql. Jamais utilisée en production.
# Le dossier de l'application est monté en lecture seule sur /opt/vision ; seul frontend/public est publié.
FROM php:8.4-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite headers \
    && sed -ri 's!/var/www/html!/opt/vision/frontend/public!g' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /opt/vision/frontend/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/vision.conf \
    && a2enconf vision \
    && mkdir -p /var/lib/avereo/vision/nonces \
    && chown -R www-data:www-data /var/lib/avereo

WORKDIR /opt/vision
