<?php
declare(strict_types=1);

/** Validate only; never decode/re-encode the download and lose unknown/large numbers. */
function api_complete_report_download(string $json): ?array
{
    try {
        $report = json_decode($json, false, 512, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
    } catch (JsonException) {
        return null;
    }
    if (!$report instanceof stdClass || !isset($report->observations) || !is_array($report->observations)) {
        return null;
    }
    $photos = 0;
    foreach ($report->observations as $observation) {
        if (!$observation instanceof stdClass || (isset($observation->photos) && !is_array($observation->photos))) {
            return null;
        }
        $photos += count($observation->photos ?? []);
    }
    return ['sha256' => hash('sha256', $json), 'bytes' => strlen($json),
        'observations' => count($report->observations), 'photos' => $photos,
        'plans' => isset($report->plans) && is_array($report->plans) ? count($report->plans) : 0,
        'signature' => !empty($report->signature)];
}
