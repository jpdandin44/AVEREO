<?php

declare(strict_types=1);

// Amorçage commun des points d'accès : configuration, gestion des erreurs, en-têtes. Refusé en accès direct (.htaccess).

require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/droits.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/projects.php';

/**
 * Prépare une requête : aucune erreur PHP affichée, toute exception convertie en JSON sans détail interne.
 * @return array la configuration validée
 */
function vision_bootstrap(): array
{
    ini_set('display_errors', '0');
    vision_send_headers();
    set_exception_handler(static function (Throwable $exception): void {
        if ($exception instanceof VisionHttpException) {
            vision_error($exception->status, $exception->errorCode, $exception->getMessage());
        }
        if ($exception instanceof VisionConfigException) {
            error_log('Vision : configuration invalide : ' . $exception->getMessage());
            vision_error(503, 'misconfigured', "L'application n'est pas configurée correctement.");
        }
        // Un message de MySQL peut contenir des valeurs (« Duplicate entry '…' ») : pour la base, on ne journalise que le type et le code.
        $detail = $exception instanceof PDOException ? 'code ' . $exception->getCode() : $exception->getMessage();
        error_log('Vision : erreur interne : ' . $exception::class . ' ' . $detail);
        vision_error(500, 'internal_error', 'Erreur interne.');
    });
    return vision_config();
}
