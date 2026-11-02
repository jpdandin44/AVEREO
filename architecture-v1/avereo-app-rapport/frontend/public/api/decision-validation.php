<?php
declare(strict_types=1);

// Only validates the optional JSON block; existing owner/role checks stay in reports.php.
function api_decision_payload_error(mixed $value): ?string
{
    if (!is_array($value) || array_is_list($value) && $value !== []) {
        return 'Le bloc aide à la décision doit être un objet.';
    }
    if (isset($value['schema_version']) && $value['schema_version'] !== 1) {
        return 'Version du bloc aide à la décision non prise en charge.';
    }
    $texts = static function (array $row, array $keys): bool {
        if (array_is_list($row) && $row !== []) return false;
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && (!is_string($row[$key]) || strlen($row[$key]) > 32000)) {
                return false;
            }
        }
        return true;
    };
    $references = static function (mixed $ids): bool {
        if (!is_array($ids) || !array_is_list($ids) || count($ids) > 100) return false;
        foreach ($ids as $id) if (!is_string($id) || $id === '' || strlen($id) > 190) return false;
        return true;
    };
    foreach ([
        'habitants' => ['occupation', 'sensibilites', 'non_negociables', 'tolerances'],
        'projet' => ['objectif', 'budget', 'calendrier', 'delegation', 'diy'],
        'arbitrage' => ['option_proposee', 'motif', 'prochaine_etape'],
    ] as $key => $keys) {
        if (array_key_exists($key, $value) && (!is_array($value[$key]) || !$texts($value[$key], $keys))) return "Rubrique {$key} invalide.";
    }
    $collections = [
        'attentes' => ['id', 'libelle', 'priorite', 'source'],
        'liens' => ['id', 'observation_id', 'effet', 'verification'],
        'actions' => ['id', 'intitule', 'categorie', 'priorite', 'horizon', 'prealables', 'explication'],
    ];
    foreach ($collections as $key => $keys) {
        if (!array_key_exists($key, $value)) continue;
        if (!is_array($value[$key]) || !array_is_list($value[$key]) || count($value[$key]) > 100) return "Liste {$key} invalide ou trop longue.";
        foreach ($value[$key] as $row) {
            if (!is_array($row) || !$texts($row, $keys)) return "Entrée {$key} invalide.";
            if (isset($row['id']) && strlen($row['id']) > 190) return "Identifiant {$key} trop long.";
            foreach (['attente_ids', 'observation_ids'] as $referenceKey) {
                if (array_key_exists($referenceKey, $row) && !$references($row[$referenceKey])) return "Références {$key} invalides.";
            }
            if (array_key_exists('incontournable', $row) && !is_bool($row['incontournable'])) return 'Indicateur incontournable invalide.';
        }
    }
    foreach (['option_a', 'option_b'] as $key) {
        if (!array_key_exists($key, $value)) continue;
        $option = $value[$key];
        if (!is_array($option) || !$texts($option, ['nom', 'objectif'])) return "{$key} invalide.";
        if (array_key_exists('action_ids', $option) && !$references($option['action_ids'])) return "Actions de {$key} invalides.";
        if (array_key_exists('criteres', $option) && (!is_array($option['criteres']) || !$texts($option['criteres'],
            ['energie', 'materiaux', 'usage', 'aides', 'realisation', 'budget', 'calendrier', 'occupation', 'incertitudes']))) return "Critères de {$key} invalides.";
    }
    return null;
}
