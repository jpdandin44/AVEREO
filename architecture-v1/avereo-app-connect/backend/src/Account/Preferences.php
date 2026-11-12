<?php

declare(strict_types=1);

namespace Avereo\Connect\Account;

use Avereo\Connect\Http\ApiException;

/** Private server storage, keyed only by the authenticated CONNECT account ID. */
final class Preferences
{
    public function __construct(private readonly string $directory) {}

    private function file(int $userId): string
    {
        if ($userId < 1) throw new \InvalidArgumentException('Compte invalide.');
        if (is_link($this->directory) || (is_dir($this->directory)
            && str_replace('\\', '/', (string) realpath($this->directory)) !== str_replace('\\', '/', rtrim($this->directory, '/\\')))) {
            throw new \RuntimeException('Stockage privé invalide.');
        }
        return $this->directory . '/' . $userId . '.json';
    }

    public static function validate(array $values): array
    {
        if (array_keys($values) !== ['accountBadge'] || !is_string($values['accountBadge'])
            || !preg_match('/\A[\p{L}\p{Nd}]{1,3}\z/u', $values['accountBadge'])) {
            throw new ApiException(422, 'INVALID_ACCOUNT_PREFERENCES', 'Le médaillon doit contenir de 1 à 3 lettres ou chiffres.');
        }
        return $values;
    }

    public function read(int $userId): array
    {
        $file = $this->file($userId);
        if (is_link($file)) throw new \RuntimeException('Stockage privé invalide.');
        if (!is_file($file)) return ['accountBadge' => 'MOI'];
        if (filesize($file) > 512) throw new \RuntimeException('Préférences invalides.');
        return self::validate(json_decode((string) file_get_contents($file), true, 8, JSON_THROW_ON_ERROR));
    }

    public function save(int $userId, array $values): array
    {
        $values = self::validate($values);
        $file = $this->file($userId);
        if (!is_dir($this->directory) && !@mkdir($this->directory, 0700) && !is_dir($this->directory)) throw new \RuntimeException('Stockage indisponible.');
        $file = $this->file($userId);
        if (is_link($file) || is_link($file . '.lock')) throw new \RuntimeException('Stockage privé invalide.');
        $lock = fopen($file . '.lock', 'c');
        if (!$lock) throw new \RuntimeException('Stockage indisponible.');
        $temporary = false;
        try {
            if (!chmod($file . '.lock', 0600) || !flock($lock, LOCK_EX)) throw new \RuntimeException('Verrouillage indisponible.');
            $temporary = tempnam($this->directory, '.preferences-');
            if ($temporary === false || !chmod($temporary, 0600)) throw new \RuntimeException('Stockage indisponible.');
            $json = json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            if (file_put_contents($temporary, $json) !== strlen($json) || !rename($temporary, $file)) throw new \RuntimeException('Enregistrement indisponible.');
        } finally {
            if ($temporary !== false && is_file($temporary)) unlink($temporary);
            flock($lock, LOCK_UN);
            fclose($lock);
        }
        return $values;
    }
}
