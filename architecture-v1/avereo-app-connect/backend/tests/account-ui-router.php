<?php
declare(strict_types=1);
// Deliberately test-only: localhost plus two explicit environment flags, no real identity or mail.
if(getenv('APP_ENV')!=='local' || getenv('ACCOUNT_UI_FIXTURE')!=='true'
    || !in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)) {http_response_code(403);exit;}
require dirname(__DIR__).'/src/autoload.php';
require __DIR__.'/account-administration-fixture.php';
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if($path==='/') {
    header('Cache-Control: no-store');
    echo str_replace('<body>','<body><div style="padding:12px;background:#fff1be;color:#372f00">Recette locale — identités fictives uniquement ; aucun e-mail réel. Mot de passe et réception du mail non qualifiés ici.</div>',file_get_contents(dirname(__DIR__).'/public/index.html'));return true;
}
if (getenv('PROFILES_UI_FIXTURE')==='true' && $path==='/fixture/profiles-account') {
    $actor=$_GET['actor']??'1';
    if(!in_array($actor,['1','2'],true)){http_response_code(400);exit;}
    setcookie('profiles_fixture_actor',$actor,['path'=>'/','httponly'=>true,'samesite'=>'Strict']);
    header('Location: /');exit;
}
if(!str_starts_with($path,'/api/'))return false;
$db=(string)getenv('ACCOUNT_UI_DB');
if($db==='' || !is_dir(dirname($db)))throw new RuntimeException('Private fixture database required.');
if ($path === '/api/v1/appearance') {
    putenv('AVEREO_PRIVATE_CONFIG='.dirname($db).'/config.php');
    require dirname(__DIR__).'/public/index.php';
    return true;
}
$pdo=accountTestDatabase($db);
if(!is_file($db.'.policy.json') && (int)$pdo->query("SELECT COUNT(*) FROM users WHERE application_access_mode='explicit'")->fetchColumn()===0)
    file_put_contents($db.'.policy.json','{"version":1,"accounts":{}}');
$identity=new class implements \Avereo\Connect\Identity\AccountIdentityProvisioner {
    public function provision(string $email,string $name,string $request, bool $linkExisting = false):string {
        if(!str_ends_with($email,'@example.invalid'))throw new \Avereo\Connect\Http\ApiException(422,'TEST_ADDRESS_REQUIRED','Utilisez une adresse @example.invalid pour cette recette locale.');
        if ($email === 'historique@example.invalid') {
            if (!$linkExisting) throw new \Avereo\Connect\Http\ApiException(409,'IDENTITY_EXISTS','Identité de recette existante.');
            return '42';
        }
        if ($linkExisting) throw new \Avereo\Connect\Http\ApiException(409,'IDENTITY_LINK_UNAVAILABLE','Identité de recette introuvable.');
        return (string)(1000 + hexdec(substr(hash('sha256',$email),0,12)));
    }
};
$notifier=new class implements \Avereo\Connect\Identity\AccountActivationNotifier, \Avereo\Connect\Identity\AccountPasswordResetNotifier {
    public function send(int $id,string $subject,string $email,string $name,string $request):array {
        if(!str_ends_with($email,'@example.invalid'))throw new RuntimeException('Test address required.');
        if (str_starts_with($email, 'echec')) throw new \Avereo\Connect\Http\ApiException(502,'TEST_MAIL_FAILED','Échec d’envoi simulé.');
        return ['status'=>'sent','expiresInSeconds'=>86400];
    }
    public function sendPasswordReset(int $id,string $subject,string $email,string $name,string $request):array {
        return $this->send($id,$subject,$email,$name,$request);
    }
};
$profileCatalog=null;$profileAdministration=null;$fixtureActor=1;$fixtureSubject='owner';
if(getenv('PROFILES_UI_FIXTURE')==='true') {
    $pdo->exec("UPDATE users SET drupal_subject='10' WHERE id=1 AND drupal_subject='owner'; UPDATE users SET drupal_subject='20' WHERE id=2 AND drupal_subject='member'");
    $fixtureActor=($_COOKIE['profiles_fixture_actor']??'1')==='2'?2:1;$fixtureSubject=$fixtureActor===1?'10':'20';
    $profileCatalog=new \Avereo\Connect\Administration\ProfileCatalog($db.'.profiles.json');
    if(!is_file($db.'.profiles.json'))$profileCatalog->save(\Avereo\Connect\Administration\ProfileCatalog::initial());
    require dirname(__DIR__,2).'/integrations/drupal/avereo_identity_bridge/src/Security/ProfileRoleAssertion.php';
    $authority=new \Drupal\avereo_identity_bridge\Security\ProfileRoleAssertion(str_repeat('local-profile-key-',4),'https://identity.example.invalid','10',
        static function(string $subject)use($db):array {
            $flags=is_file($db.'.role.json')?json_decode(file_get_contents($db.'.role.json'),true):['active'=>true,'global'=>true];
            return ['active'=>$flags['active']===true,'adminRole'=>'administrator','adminRoleIsGlobal'=>$flags['global']===true,'hasAdminRole'=>$flags['global']===true];
        },static fn(string $nonce,int $exp):bool=>true);
    $profileGuard=new \Avereo\Connect\Administration\GlobalProfileAdministrator(1,str_repeat('local-profile-key-',4),'https://identity.example.invalid',
        static fn(int $id):array=>['active'=>true,'subject'=>'10'],$authority->decide(...));
}
$repo=new \Avereo\Connect\Repository\PdoConnectRepository($pdo,null,$profileCatalog);
$policy=new \Avereo\Connect\Administration\TrialPolicyStore($db.'.policy.json',$profileCatalog);
if($profileCatalog!==null)$profileAdministration=new \Avereo\Connect\Administration\ProfileAdministration($pdo,$profileCatalog,$policy,$profileGuard->assert(...));
$service=new \Avereo\Connect\Administration\AccountAdministration($pdo,$identity,$policy);
$reports = new PDO('sqlite:'.$db.'.reports', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$transfers = null;
if (getenv('ACCOUNT_UI_TRANSFER_FIXTURE') === 'true') {
    require __DIR__.'/report-transfer-fixture.php';
    if (!$reports->query("SELECT name FROM sqlite_master WHERE type='table' AND name='rapport_reports'")->fetchColumn()) {
        createReportTransferSqliteSchema($reports);
        seedReportTransferFixture($reports);
    }
    $transfers = new \Avereo\Connect\Administration\ReportTransfers($pdo,$repo,static fn()=>$reports,[7=>[1]]);
} else {
    $reports->exec('CREATE TABLE IF NOT EXISTS rapport_reports (owner_provider TEXT, owner_id TEXT, title TEXT)');
}
$deletion = new \Avereo\Connect\Identity\IdentityAccountDeletionClient(
    'https://identity.example.invalid/delete', str_repeat('fixture-only-',4),
    static function (string $body): array {
        $request = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
        if (!str_ends_with($request['email'], '@example.invalid')) throw new RuntimeException('Fixture address required.');
        $status = $request['subject'] === '42' ? 'retained' : ($request['action'] === 'check' ? 'eligible' : 'deleted');
        return [200, json_encode(['status'=>$status], JSON_THROW_ON_ERROR)];
    },
);
$lifecycle = new \Avereo\Connect\Administration\AccountLifecycle($pdo,$service,$policy,$deletion,static fn()=>$reports);
$app=new \Avereo\Connect\Application(new \Avereo\Connect\Config('local',true,null,'','','ACCOUNT_UI',1800,43200),
    $repo,null,null,$notifier,null,$service,$notifier,$lifecycle,
    appearance:new \Avereo\Connect\Administration\Appearance(dirname($db).'/appearance.json',7),
    accountPreferences:new \Avereo\Connect\Account\Preferences(dirname($db).'/account-preferences'),
    reportTransfers:$transfers,profileAdministration:$profileAdministration,profileCatalog:$profileCatalog);
$app->handle(\Avereo\Connect\Http\Request::fromGlobals(),new \Avereo\Connect\Security\AuthContext($fixtureActor,time(),$fixtureSubject),'local-ui-csrf',static fn()=>null)->emit();
