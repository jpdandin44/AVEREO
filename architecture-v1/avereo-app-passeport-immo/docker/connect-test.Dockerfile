FROM php:8.3-apache
RUN a2enmod rewrite headers \
    && printf '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/passeport-test.conf \
    && a2enconf passeport-test
