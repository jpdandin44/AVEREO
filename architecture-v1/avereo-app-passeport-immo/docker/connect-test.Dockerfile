FROM php:8.3-apache
RUN docker-php-ext-install pdo_mysql \
    && printf 'upload_max_filesize=500M\npost_max_size=512M\nmax_file_uploads=100\nmemory_limit=512M\nmax_input_time=600\nmax_execution_time=300\ndisplay_errors=Off\n' > /usr/local/etc/php/conf.d/passeport.ini \
    && a2enmod rewrite headers \
    && printf '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/passeport-test.conf \
    && a2enconf passeport-test
