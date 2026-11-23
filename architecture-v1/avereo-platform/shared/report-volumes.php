<?php
declare(strict_types=1);

/** Shared source; generated API copies must remain byte-identical. */
function avereo_volume_limits(): array
{
    static $limits;
    if ($limits === null) {
        $limits = json_decode((string)file_get_contents(__DIR__.'/report-volumes.json'), true, 16, JSON_THROW_ON_ERROR);
        if (($limits['schemaVersion'] ?? null) !== 1) throw new RuntimeException('Contrat de volume indisponible.');
        foreach (['reportJsonBytes','publicationBytes','documentFileBytes','documentBatchBytes','uploadRequestBytes','reportEnvelopeBytes'] as $key) {
            if (!is_int($limits[$key] ?? null) || $limits[$key] < 1) throw new RuntimeException('Contrat de volume invalide.');
        }
    }
    return $limits;
}

function avereo_volume_label(int $bytes): string
{
    $mo = rtrim(rtrim(number_format($bytes / 1000000, 6, ',', ' '), '0'), ',');
    return $mo.' Mo'.($bytes % (1024*1024) === 0 ? ' ('.($bytes / (1024*1024)).' Mio)' : '');
}

/** Fail before allocating large strings/arrays; an explicit unlimited PHP budget remains bounded by file limits. */
function avereo_volume_has_memory(int $additionalBytes): bool
{
    $value = trim((string)ini_get('memory_limit'));
    if ($value === '-1') return true;
    if (!preg_match('/^(\d+)\s*([KMG]?)$/iD', $value, $m)) return false;
    $factor = [''=>1,'K'=>1024,'M'=>1024**2,'G'=>1024**3][strtoupper($m[2])];
    return memory_get_usage(true) + $additionalBytes <= (int)$m[1] * $factor;
}
