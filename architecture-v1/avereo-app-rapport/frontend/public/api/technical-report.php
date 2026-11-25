<?php
declare(strict_types=1);

function api_is_technical_report(array $report): bool
{
    $category = $report['categorie'] ?? null;
    // Match the frontend's historical normalization, including missing/unknown categories.
    if (($report['report_type'] ?? null) === 'habitologie' || $category === 'Rapport Habitologue'
        || (in_array($category, ['Expertise & Visite technique', 'Expertise & visite technique'], true)
            && ($report['sous_categorie'] ?? null) === "Rapport d'habitologie")) return false;
    return !in_array($category, ['Visite Globale', 'Assistance avant-projet', 'Diagnostic specifique', 'Reception de travaux'], true);
}

/** Only the explicit right projected by CONNECT grants this capability. */
function api_can_create_technical_report(array $config, array $identity): bool
{
    if (($identity['provider'] ?? '') !== 'avereo_connect') return false;
    return api_profile_access($config,$identity)['technicalReport']===true;
}

function api_validate_technical_fields(array $report): void
{
    if (array_key_exists('mission_technique', $report)) {
        if (!is_array($report['mission_technique'])) api_json(400, ['ok'=>false,'error'=>'technical_mission_invalid']);
        foreach (['objet','perimetre','limites'] as $key) {
            if (array_key_exists($key, $report['mission_technique']) && (!is_string($report['mission_technique'][$key]) || strlen($report['mission_technique'][$key]) > 50000)) {
                api_json(400, ['ok'=>false,'error'=>'technical_mission_invalid']);
            }
        }
    }
    foreach ($report['observations'] ?? [] as $observation) {
        foreach (['mesures_techniques','references_techniques','verifications_techniques','limites_techniques'] as $key) {
            if (array_key_exists($key, $observation) && (!is_string($observation[$key]) || strlen($observation[$key]) > 50000)) {
                api_json(400, ['ok'=>false,'error'=>'technical_observation_invalid']);
            }
        }
    }
}

function api_require_technical_creation(array $config, array $identity, array $report, ?array $previous): void
{
    // Existing technical dossiers retain their existing ownership/action rules.
    // A new copy and a global-to-technical conversion require an explicit grant.
    if (api_is_technical_report($report) && !($previous && api_is_technical_report($previous))
        && !api_can_create_technical_report($config, $identity)) {
        api_json(403, ['ok'=>false,'error'=>'technical_report_refused',
            'message'=>'La création d’un Rapport Technique nécessite une habilitation de votre compte CONNECT. Le brouillon est conservé.']);
    }
}
