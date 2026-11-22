<?php
declare(strict_types=1);
require __DIR__ . '/../frontend/public/api/report-download.php';
function check(bool $value, string $message): void { if (!$value) throw new RuntimeException($message); }
foreach (['', '{', 'null', '[]', '{"updatedAt":"2026-11-13"}', '{"observations":{}}', '{"observations":[null]}', '{"observations":[{"photos":{}}]}'] as $invalid) {
    check(api_complete_report_download($invalid) === null, 'Résumé ou JSON invalide accepté');
}
$raw = '{"observations":[{"id":"fictif","observations":"Texte conservé","photos":[{"src":"data:image/png;base64,AQID"}]}],"plans":[{}],"signature":"signature","futureNumber":9007199254740993}';
$meta = api_complete_report_download($raw);
check($meta !== null && $meta['sha256'] === hash('sha256', $raw) && $meta['bytes'] === strlen($raw), 'Empreinte ou octets modifiés');
check($meta['observations'] === 1 && $meta['photos'] === 1 && $meta['plans'] === 1 && $meta['signature'], 'Contenu mal compté');
check(str_contains($raw, '9007199254740993'), 'Nombre source modifié');
check(api_complete_report_download('{"observations":[]}')['observations'] === 0, 'Ancien dossier vide refusé');
$contextRaw = '{"observations":[{"photos":[{}]}],"contexte_exterieur":{"id":"contexte","photo":{"src":"data:image/png;base64,AQID"},"champ_futur":"conservé"}}';
$contextMeta = api_complete_report_download($contextRaw);
check($contextMeta['photos'] === 2 && $contextMeta['observations'] === 1, 'La photo de contexte doit être comptée sans ajouter une observation');
check($contextMeta['sha256'] === hash('sha256', $contextRaw) && $contextMeta['bytes'] === strlen($contextRaw), 'Le contexte doit conserver les octets du téléchargement');
check(api_complete_report_download('{"observations":[],"contexte_exterieur":{"photo":null}}')['photos'] === 0, 'Un contexte sans photo ne doit pas en inventer');
echo "PASS téléchargement complet : résumés refusés, compteurs, empreinte et octets conservés.\n";
