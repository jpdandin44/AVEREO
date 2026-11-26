# Image locale de développement : PHP (serveur intégré) avec pdo_mysql. Jamais utilisée en production.
# Le dossier de l'application est monté en lecture seule sur /opt/vision ; seul frontend/public est servi.
# PHP 8.4 par défaut ; 8.3 est la version de l'hébergement O2Switch (préproduction) : vision-local.ps1 -Php 8.3.
ARG PHP_VERSION=8.4
FROM php:${PHP_VERSION}-cli

RUN docker-php-ext-install pdo_mysql \
    && mkdir -p /var/lib/avereo/vision/nonces /var/lib/avereo/vision/medias \
    && chmod 700 /var/lib/avereo/vision/medias

WORKDIR /opt/vision
