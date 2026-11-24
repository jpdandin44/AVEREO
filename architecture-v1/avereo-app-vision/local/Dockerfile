# Image locale de développement : PHP 8.4 (serveur intégré) avec pdo_mysql. Jamais utilisée en production.
# Le dossier de l'application est monté en lecture seule sur /opt/vision ; seul frontend/public est servi.
FROM php:8.4-cli

RUN docker-php-ext-install pdo_mysql \
    && mkdir -p /var/lib/avereo/vision/nonces

WORKDIR /opt/vision
