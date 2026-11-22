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
        if (count($values) !== 1 || array_diff(array_keys($values), ['accountBadge', 'professionalProfile'])) {
            throw new ApiException(422, 'INVALID_ACCOUNT_PREFERENCES', 'Modifiez une préférence proposée à la fois.');
        }
        if (array_key_exists('accountBadge', $values) && (!is_string($values['accountBadge'])
            || !preg_match('/\A[\p{L}\p{Nd}]{1,3}\z/u', $values['accountBadge']))) {
            throw new ApiException(422, 'INVALID_ACCOUNT_PREFERENCES', 'Le médaillon doit contenir de 1 à 3 lettres ou chiffres.');
        }
        if (array_key_exists('professionalProfile', $values)
            && !in_array($values['professionalProfile'], ['', 'habitologue', 'architecte', 'maitre_oeuvre'], true)) {
            throw new ApiException(422, 'INVALID_ACCOUNT_PREFERENCES', 'Choisissez un profil professionnel proposé.');
        }
        return $values;
    }

    public function read(int $userId): array
    {
        $file = $this->file($userId);
        $values = ['accountBadge' => 'MOI', 'professionalProfile' => ''];
        // Keep badge files readable by the preceding CONNECT release, including after rollback.
        foreach (['accountBadge' => $file, 'professionalProfile' => substr($file, 0, -5) . '.professional-profile.json'] as $key => $path) {
            if (is_link($path)) throw new \RuntimeException('Stockage privé invalide.');
            if (!is_file($path)) continue;
            if (filesize($path) > 512) throw new \RuntimeException('Préférences invalides.');
            $stored = self::validate(json_decode((string) file_get_contents($path), true, 8, JSON_THROW_ON_ERROR));
            if (array_keys($stored) !== [$key]) throw new \RuntimeException('Préférences invalides.');
            $values[$key] = $stored[$key];
        }
        return $values;
    }

    public function save(int $userId, array $values): array
    {
        $values = self::validate($values);
        $base = $this->file($userId);
        $file = array_key_exists('professionalProfile', $values) ? substr($base, 0, -5) . '.professional-profile.json' : $base;
        if (!is_dir($this->directory) && !@mkdir($this->directory, 0700) && !is_dir($this->directory)) throw new \RuntimeException('Stockage indisponible.');
        $this->file($userId);
        if (is_link($file) || is_link($base . '.lock')) throw new \RuntimeException('Stockage privé invalide.');
        $lock = fopen($base . '.lock', 'c');
        if (!$lock) throw new \RuntimeException('Stockage indisponible.');
        $temporary = false;
        try {
            if (!chmod($base . '.lock', 0600) || !flock($lock, LOCK_EX)) throw new \RuntimeException('Verrouillage indisponible.');
            $result = array_replace($this->read($userId), $values);
            $temporary = tempnam($this->directory, '.preferences-');
            if ($temporary === false || !chmod($temporary, 0600)) throw new \RuntimeException('Stockage indisponible.');
            $json = json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            if (file_put_contents($temporary, $json) !== strlen($json) || !rename($temporary, $file)) throw new \RuntimeException('Enregistrement indisponible.');
        } finally {
            if ($temporary !== false && is_file($temporary)) unlink($temporary);
            flock($lock, LOCK_UN);
            fclose($lock);
        }
        return $result;
    }
}
