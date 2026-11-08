<?php

declare(strict_types=1);

namespace Avereo\Connect\Administration;

use Avereo\Connect\Http\ApiException;

final class Appearance
{
    public const DEFAULTS = ['headerHeight' => 68, 'logoWidth' => 116, 'accountTone' => 'mist'];

    public function __construct(private readonly string $file, private readonly int $organizationId)
    {
    }

    public function canEdit(array $memberships): bool
    {
        foreach ($memberships as $membership) {
            if ($this->organizationId > 0 && (int) $membership['id'] === $this->organizationId
                && in_array($membership['role'], ['owner', 'admin'], true)) {
                return true;
            }
        }
        return false;
    }

    private function values(array $data): array
    {
        if (count($data) !== 3 || !in_array($data['headerHeight'] ?? null, [56, 68, 84], true)
            || !in_array($data['logoWidth'] ?? null, [100, 116, 136], true)
            || !in_array($data['accountTone'] ?? null, ['white', 'mist'], true)) {
            throw new ApiException(422, 'INVALID_APPEARANCE', 'Choisissez une valeur proposée pour chaque réglage.');
        }
        return array_intersect_key($data, self::DEFAULTS);
    }

    public function read(): array
    {
        if (!is_file($this->file)) return self::DEFAULTS;
        $data = json_decode((string) file_get_contents($this->file), true, flags: JSON_THROW_ON_ERROR);
        return $this->values($data);
    }

    public function save(array $data): array
    {
        $values = $this->values($data);
        $directory = dirname($this->file);
        if (!is_dir($directory) || !is_writable($directory)) {
            throw new ApiException(503, 'APPEARANCE_STORAGE', 'Le stockage du modèle est indisponible.');
        }
        $temporary = tempnam($directory, '.appearance-');
        if ($temporary === false) throw new \RuntimeException('Stockage indisponible');
        try {
            $json = json_encode($values, JSON_THROW_ON_ERROR);
            if (file_put_contents($temporary, $json) !== strlen($json) || !rename($temporary, $this->file)) {
                throw new \RuntimeException('Enregistrement impossible');
            }
        } finally {
            if (is_file($temporary)) unlink($temporary);
        }
        return $values;
    }
}
