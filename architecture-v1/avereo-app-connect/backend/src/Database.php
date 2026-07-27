<?php

declare(strict_types=1);

namespace Avereo\Connect;

final class Database
{
    public static function connect(Config $config): ?\PDO
    {
        if ($config->databaseDsn === null) {
            return null;
        }
        if (!str_starts_with($config->databaseDsn, 'mysql:')) {
            throw new \RuntimeException('Seuls les DSN MySQL/MariaDB sont autorisés.');
        }

        $pdo = new \PDO(
            $config->databaseDsn,
            $config->databaseUser,
            $config->databasePassword,
            [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
        $pdo->exec("SET time_zone = '+00:00'");
        return $pdo;
    }
}
