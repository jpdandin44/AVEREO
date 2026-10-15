FROM php:8.3-apache
RUN docker-php-ext-install pdo_mysql \
    && printf 'upload_max_filesize=25M\npost_max_size=105M\nmax_file_uploads=100\ndisplay_errors=Off\n' > /usr/local/etc/php/conf.d/passeport.ini \
    && a2enmod rewrite headers \
    && printf '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/passeport-test.conf \
    && a2enconf passeport-test
