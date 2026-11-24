<?php

declare(strict_types=1);

/** Connexion PDO MySQL : utf8mb4, exceptions, requêtes préparées natives, heure UTC. */
function vision_pdo(array $config): PDO
{
    $db = $config['db'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], (int) $db['port'], $db['name']);
    try {
        $pdo = new PDO($dsn, (string) $db['user'], (string) $db['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    } catch (PDOException $exception) {
        error_log('Vision : connexion à la base impossible (' . $exception->getCode() . ').');
        throw new VisionHttpException(503, 'database_unavailable', 'La base de données est indisponible.');
    }
    return $pdo;
}
