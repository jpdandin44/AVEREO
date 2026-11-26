<?php
declare(strict_types=1);
require_once __DIR__ . '/http_support.php';
require_once __DIR__ . '/../../frontend/public/api/lib/http.php';
require_once __DIR__ . '/migrations_test.php';
require_once __DIR__ . '/../../frontend/public/api/lib/projects.php';
require_once __DIR__ . '/../../frontend/public/api/lib/sync.php';
require_once __DIR__ . '/../../frontend/public/api/lib/medias.php';
require_once __DIR__ . '/../../deploiement/verifier-prive.php';

const VISION_TEST_PHOTO_ID = '12345678-1234-4234-8234-123456789012';
function vision_test_png(): string
{
    return (string) base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=');
}
function vision_test_photo_data(): array
{
    return ['xMm' => 100, 'yMm' => 200, 'prisLe' => '2026-11-26T12:00:00Z', 'largeurPx' => 1, 'hauteurPx' => 1,
        'tailleOctets' => strlen(vision_test_png()), 'sha256' => hash('sha256', vision_test_png()), 'mime' => 'image/png'];
}

vision_test('terrain : validation stricte photos, commentaires et cotes laser', function () {
    $photo = vision_test_photo_data();
    vision_assert_true(vision_terrain_valid('photo', $photo));
    foreach (['xMm' => 1.5, 'prisLe' => 'hier', 'sha256' => 'x', 'mime' => 'text/plain', 'tailleOctets' => 2500001, 'largeurPx' => 0, 'intrus' => 1, 'pieceId' => '../'] as $key => $value) {
        vision_assert_false(vision_terrain_valid('photo', [$key => $value] + $photo), $key);
    }
    foreach ([['type'=>'point','xMm'=>1,'yMm'=>2], ['type'=>'mur','pieceId'=>'salon','murIndex'=>0,'positionMm'=>500], ['type'=>'piece','pieceId'=>'salon'], ['type'=>'photo','photoId'=>VISION_TEST_PHOTO_ID]] as $cible) {
        vision_assert_true(vision_terrain_valid('commentaire', ['texte'=>str_repeat('é',500),'cible'=>$cible]));
        vision_assert_false(vision_terrain_valid('commentaire', ['texte'=>str_repeat('é',501),'cible'=>$cible]));
        vision_assert_false(vision_terrain_valid('commentaire', ['texte'=>' ','cible'=>$cible]));
        vision_assert_false(vision_terrain_valid('commentaire', ['texte'=>'x','cible'=>$cible + ['evil'=>1]]));
    }
    vision_assert_true(vision_terrain_valid('cotesLaser', ['longueur'=>['murIndex'=>0,'valeurMm'=>4012],'controle'=>['type'=>'diagonale','deSommet'=>0,'aSommet'=>2,'valeurMm'=>5000]]));
    foreach ([0,100001,1.5] as $mm) vision_assert_false(vision_terrain_valid('cotesLaser', ['longueur'=>['murIndex'=>0,'valeurMm'=>$mm]]));
    foreach ([-1,64,0.5] as $index) vision_assert_false(vision_terrain_valid('cotesLaser', ['largeur'=>['murIndex'=>$index,'valeurMm'=>3000]]));
});

vision_test('terrain : signatures binaires, empreintes et taille, UUID et chemins', function () {
    $raw = vision_test_png();
    vision_media_validate($raw, 'image/png', hash('sha256', $raw));
    vision_assert_throws(fn () => vision_media_validate('texte.jpg', 'image/jpeg', hash('sha256','texte.jpg')), VisionHttpException::class);
    vision_assert_throws(fn () => vision_media_validate($raw, 'image/jpeg', hash('sha256',$raw)), VisionHttpException::class);
    vision_assert_throws(fn () => vision_media_validate($raw, 'image/png', str_repeat('a',64)), VisionHttpException::class);
    vision_assert_throws(fn () => vision_media_validate(str_repeat('a',2500001), 'image/png', str_repeat('a',64)), VisionHttpException::class);
    foreach (['../', 'abc', [], null, str_repeat('a',36)] as $bad) vision_assert_false(vision_media_uuid($bad));
    vision_assert_true(vision_media_uuid(VISION_TEST_PHOTO_ID));
});

vision_test('terrain : dossier privé obligatoire, permissions 700 et hors web', function () {
    $dir = sys_get_temp_dir() . '/vision-media-test-' . bin2hex(random_bytes(4));
    mkdir($dir, 0700);
    try {
        vision_assert_true(vision_media_directory_safe($dir, __DIR__));
        vision_assert_false(vision_media_directory_safe(__DIR__, __DIR__));
        vision_assert_false(vision_media_directory_safe('relatif', __DIR__));
        vision_assert_throws(fn () => vision_verify_private_media([]));
        if (PHP_OS_FAMILY !== 'Windows') {
            vision_verify_private_media(['media_directory'=>$dir], __DIR__);
            chmod($dir, 0755); clearstatcache();
            vision_assert_throws(fn () => vision_verify_private_media(['media_directory'=>$dir], __DIR__));
        }
    } finally { rmdir($dir); }
});

vision_test('terrain API : PUT, idempotence, conflit, lecture, droits, archivage et suppression', function () {
    $user = vision_api_user();
    $created = vision_api('POST', '/api/projects.php', $user, ['name'=>'Photo terrain fictive']);
    $project = $created['json']['project']['id'];
    $id = VISION_TEST_PHOTO_ID;
    $url = '/api/medias.php?project=' . $project . '&id=' . $id;
    $config = vision_api_test_config();
    $raw = vision_test_png();
    $headers = ['Authorization'=>'Bearer '.$config['api_token'], 'X-Vision-Local-User'=>$user, 'Content-Type'=>'image/png', 'X-Vision-Sha256'=>hash('sha256',$raw), 'X-Vision-Expected-Identity'=>'local:'.$user];
    vision_assert_same(201, vision_http('PUT', $url, $headers, $raw)['status']);
    vision_assert_same(200, vision_http('PUT', $url, $headers, $raw)['status']);
    $other = $raw . 'autre';
    vision_assert_same(409, vision_http('PUT', $url, ['X-Vision-Sha256'=>hash('sha256',$other)]+$headers, $other)['status']);
    vision_assert_same(413, vision_http('PUT', $url, $headers, str_repeat('a',2500001))['status']);
    vision_assert_same(415, vision_http('PUT', $url, ['Content-Type'=>'image/jpeg']+$headers, 'texte.jpg')['status']);
    vision_assert_same(422, vision_http('PUT', $url, ['X-Vision-Sha256'=>str_repeat('0',64)]+$headers, $raw)['status']);
    foreach (['../','non-uuid'] as $bad) vision_assert_same(404, vision_http('PUT', '/api/medias.php?project='.$project.'&id='.urlencode($bad), $headers, $raw)['status']);
    vision_assert_same(401, vision_http('GET', $url)['status']);
    vision_assert_same(404, vision_api('GET', $url, vision_api_user())['status']);
    vision_assert_same(409, vision_api('GET', $url, $user, null, ['X-Vision-Expected-Identity'=>'local:autre'])['status']);
    $get = vision_http('GET', $url, $headers);
    vision_assert_same(200, $get['status']);
    vision_assert_same($raw, $get['raw']);
    vision_assert_same('image/png', $get['headers']['content-type']);
    vision_assert_same('nosniff', $get['headers']['x-content-type-options']);
    vision_assert_same('private, max-age=86400', $get['headers']['cache-control']);
    vision_assert_same(200, vision_api('GET', $url, vision_api_admin_id())['status']);
    vision_api('PATCH', '/api/projects.php?id='.$project, $user, ['status'=>'archived']);
    vision_assert_same(409, vision_http('PUT', $url, $headers, $raw)['status']);
    vision_assert_same(409, vision_http('DELETE', $url, $headers)['status']);
    vision_assert_same(200, vision_http('GET', $url, $headers)['status']);
    vision_api('PATCH', '/api/projects.php?id='.$project, $user, ['status'=>'active']);
    vision_assert_same(200, vision_http('DELETE', $url, $headers)['status']);
    vision_assert_same(404, vision_http('GET', $url, $headers)['status']);
});

vision_test('terrain migrations : 003/004 rejouables, contenu et autres colonnes préservés', function () {
    $pdo = vision_migration_test_pdo();
    // Empreinte calculée par MySQL (nombre de lignes + somme de contrôle de toutes les colonnes) :
    // la base de test peut contenir des dizaines de milliers de lignes, les charger en PHP épuisait la mémoire.
    $empreinte = static function (string $table) use ($pdo): array {
        $champs = array_map(static fn (array $c): string => "COALESCE(CAST(`{$c['Field']}` AS CHAR), '∅')",
            $pdo->query("SHOW COLUMNS FROM $table")->fetchAll());
        return $pdo->query("SELECT COUNT(*) AS n, COALESCE(BIT_XOR(CRC32(CONCAT_WS('#', " . implode(', ', $champs) . "))), 0) AS h FROM $table")->fetch();
    };
    $before = [];
    foreach (['vision_objects','vision_sync_log'] as $table) {
        $before[$table] = $empreinte($table);
        $cols[$table] = $pdo->query("SHOW COLUMNS FROM $table")->fetchAll();
    }
    foreach (['003_create_vision_media.sql','004_extend_vision_sync_kinds.sql'] as $file) {
        $sql = file_get_contents(__DIR__.'/../../database/migrations/'.$file);
        for ($i=0;$i<2;$i++) { $stmt=$pdo->query($sql); do {} while ($stmt->nextRowset()); }
    }
    foreach (['vision_objects','vision_sync_log'] as $table) {
        vision_assert_same($before[$table], $empreinte($table), "contenu de $table inchangé");
        $after = $pdo->query("SHOW COLUMNS FROM $table")->fetchAll();
        foreach ($after as $i=>$col) {
            if ($col['Field'] === 'kind') vision_assert_same("enum('batiment','niveau','piece','ouverture','photo','commentaire')", $col['Type']);
            else vision_assert_same($cols[$table][$i], $col);
        }
    }
});

vision_test('terrain sync API : photo et commentaire reçus, conflit journalisé, cotes compatibles', function () {
    $user = vision_api_user();
    $project = vision_api('POST', '/api/projects.php', $user, ['name'=>'Sync terrain fictif'])['json']['project']['id'];
    $change = static fn ($id, $kind, $parent, $data, $rev=0) => ['object_id'=>$id,'kind'=>$kind,'parent_id'=>$parent,'base_rev'=>$rev,'deleted'=>false,'data'=>$data];
    $piece = ['nom'=>'Salon','ordre'=>0,'hauteurMm'=>2500,'sommets'=>[['x'=>0,'y'=>0],['x'=>4000,'y'=>0],['x'=>4000,'y'=>3000],['x'=>0,'y'=>3000]],'cotesLaser'=>['longueur'=>['murIndex'=>0,'valeurMm'=>4012]]];
    $comment = ['texte'=>'Mur fictif','cible'=>['type'=>'mur','pieceId'=>'salon','murIndex'=>0,'positionMm'=>500]];
    $changes = [$change('batiment-1','batiment',null,['nom'=>'Maison']),$change('niveau-1','niveau','batiment-1',['nom'=>'RDC','ordre'=>0]),$change('salon','piece','niveau-1',$piece),$change(VISION_TEST_PHOTO_ID,'photo','niveau-1',vision_test_photo_data()),$change('comment-1','commentaire','niveau-1',$comment)];
    $url = '/api/sync.php?project='.$project;
    $reply = vision_api('POST', $url, $user, ['device_id'=>'telephone-test','since'=>0,'changes'=>$changes]);
    vision_assert_same(200, $reply['status']);
    vision_assert_same(5, count($reply['json']['applied']));
    $pull = vision_api('GET', $url.'&since=0', $user);
    vision_assert_same(5, count($pull['json']['changes']));
    $comment['texte'] = 'Autre appareil';
    $conflict = vision_api('POST', $url, $user, ['device_id'=>'bureau-test','since'=>0,'changes'=>[$change('comment-1','commentaire','niveau-1',$comment)]]);
    vision_assert_same('conflict', $conflict['json']['applied'][0]['status']);
    $journal = vision_api('GET', $url.'&journal=1', $user);
    vision_assert_same('commentaire', $journal['json']['entries'][0]['kind']);
    $piece['cotesLaser']['longueur']['valeurMm'] = 100001;
    vision_assert_same(422, vision_api('POST',$url,$user,['device_id'=>'telephone-test','since'=>0,'changes'=>[$change('salon','piece','niveau-1',$piece,1)]])['status']);
});
