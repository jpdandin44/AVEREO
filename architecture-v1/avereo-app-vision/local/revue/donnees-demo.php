<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Chargement des données réservé à la ligne de commande.';
    exit(1);
}

try {
    $lib = '/opt/vision/frontend/public/api/lib/';
    foreach (['config.php', 'http.php', 'db.php', 'projects.php'] as $file) {
        require_once $lib . $file;
    }
    $config = vision_config();
    if (($config['environment'] ?? null) !== 'local') {
        throw new RuntimeException('Chargement des données autorisé uniquement en environnement local.');
    }
    if (is_file($lib . 'sync.php')) {
        require_once $lib . 'sync.php';
    }
    $pdo = vision_pdo($config);
    // --retablir : remet les relevés de démonstration dans leur état d'origine (écrase les modifications faites pendant la recette).
    // Sans lui, un relevé n'est chargé que si le projet n'a encore aucun contenu : relancer « up » ne défait jamais une recette.
    $retablir = in_array('--retablir', $argv ?? [], true);
    $demos = [
        ['id' => 'de000000000000000000000000000a01', 'owner' => '900001', 'name' => 'Maison Martin (démo)',
            'address' => '12 rue des Lilas, Nantes', 'client_label' => 'M. et Mme Martin (fictifs)', 'releve' => 'ref2.json'],
        ['id' => 'de000000000000000000000000000a02', 'owner' => '900001', 'name' => 'Appartement en L (démo)',
            'address' => '3 place du Marché, Rennes', 'releve' => 'ref3.json'],
        ['id' => 'de000000000000000000000000000a03', 'owner' => '900001', 'name' => 'Ancien projet (démo, archivé)', 'archive' => true],
        ['id' => 'de000000000000000000000000000b01', 'owner' => '900002', 'name' => 'Studio Durand (démo)'],
    ];
    $crees = 0;
    $presents = 0;
    $releves = 0;
    foreach ($demos as $demo) {
        $identite = ['provider' => 'avereo_connect', 'id' => $demo['owner']];
        $projet = vision_project_find($pdo, $demo['id']);
        if ($projet === null) {
            // Lot 2A/main ignore clean['id'] et génère un public_id aléatoire : retrouver la démo
            // par son nom ET son propriétaire rend le rejeu idempotent sur cette version aussi.
            $statement = $pdo->prepare('SELECT * FROM vision_projects WHERE name = ? AND owner_provider = ? AND owner_id = ? ORDER BY id LIMIT 1');
            $statement->execute([$demo['name'], $identite['provider'], $identite['id']]);
            $row = $statement->fetch();
            $projet = $row === false ? null : $row;
        }
        if ($projet === null) {
            $projet = vision_project_create($pdo, $identite, [
                'id' => $demo['id'], 'name' => $demo['name'],
                'address' => $demo['address'] ?? '', 'client_label' => $demo['client_label'] ?? '',
            ]);
            $crees++;
        } else {
            $presents++;
        }
        if ($projet['owner_provider'] !== $identite['provider'] || $projet['owner_id'] !== $identite['id']) {
            throw new RuntimeException('Le propriétaire du projet de démonstration est incohérent.');
        }
        if (($demo['archive'] ?? false) && $projet['status'] === 'active') {
            $projet = vision_project_update($pdo, $projet['public_id'], $identite, ['status' => 'archived']);
        }
        $dejaRempli = false;
        if (isset($demo['releve']) && function_exists('vision_sync_exchange') && !$retablir) {
            $compte = $pdo->prepare('SELECT COUNT(*) FROM vision_objects WHERE project_id = ?');
            $compte->execute([(int) $projet['id']]);
            $dejaRempli = (int) $compte->fetchColumn() > 0;
        }
        if (isset($demo['releve']) && function_exists('vision_sync_exchange') && !$dejaRempli) {
            $contenu = file_get_contents(__DIR__ . '/donnees/' . $demo['releve']);
            if ($contenu === false) {
                throw new RuntimeException('Relevé de démonstration introuvable.');
            }
            $body = json_decode($contenu, true, 32, JSON_THROW_ON_ERROR);
            $request = vision_sync_validate_request([
                'device_id' => 'donnees-demo', 'since' => 0, 'changes' => $body['changes'],
            ]);
            // Accepter le résultat direct ou le couple clean/errors employé par les validateurs de l'API.
            if (($request['errors'] ?? []) !== []) {
                throw new RuntimeException('Relevé de démonstration invalide.');
            }
            $changements = ($request['clean'] ?? $request)['changes'];
            vision_sync_exchange($pdo, $projet, $identite, 'donnees-demo', 0, $changements);
            $releves++;
        }
    }
    echo "Projets : $crees créés, $presents déjà présents." . PHP_EOL;
    echo function_exists('vision_sync_exchange')
        ? ($retablir ? "Relevés : $releves rétablis dans leur état d'origine." : "Relevés : $releves chargés (les relevés déjà remplis sont conservés ; --retablir pour revenir à l'origine).") . PHP_EOL
        : 'Relevés : absents de cette version (synchronisation indisponible).' . PHP_EOL;
    exit(0);
} catch (Throwable $exception) {
    // Ne pas exposer de configuration ni d'éventuels paramètres SQL dans la sortie.
    fwrite(STDERR, 'Échec du chargement des données de démonstration (' . $exception::class . ').' . PHP_EOL);
    exit(1);
}
