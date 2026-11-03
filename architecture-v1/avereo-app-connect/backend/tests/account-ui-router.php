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
if(!str_starts_with($path,'/api/'))return false;
$db=(string)getenv('ACCOUNT_UI_DB');
if($db==='' || !is_dir(dirname($db)))throw new RuntimeException('Private fixture database required.');
$pdo=accountTestDatabase($db);
if(!is_file($db.'.policy.json') && (int)$pdo->query("SELECT COUNT(*) FROM users WHERE application_access_mode='explicit'")->fetchColumn()===0)
    file_put_contents($db.'.policy.json','{"version":1,"accounts":{}}');
$identity=new class implements \Avereo\Connect\Identity\AccountIdentityProvisioner {
    public function provision(string $email,string $name,string $request):string {
        if(!str_ends_with($email,'@example.invalid'))throw new \Avereo\Connect\Http\ApiException(422,'TEST_ADDRESS_REQUIRED','Utilisez une adresse @example.invalid pour cette recette locale.');
        $h=hash('sha256',$email);return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20,12);
    }
};
$notifier=new class implements \Avereo\Connect\Identity\AccountActivationNotifier {
    public function send(int $id,string $subject,string $email,string $name,string $request):array {
        if(!str_ends_with($email,'@example.invalid'))throw new RuntimeException('Test address required.');
        return ['status'=>'sent','expiresInSeconds'=>86400];
    }
};
$repo=new \Avereo\Connect\Repository\PdoConnectRepository($pdo);
$service=new \Avereo\Connect\Administration\AccountAdministration($pdo,$identity,new \Avereo\Connect\Administration\TrialPolicyStore($db.'.policy.json'));
$app=new \Avereo\Connect\Application(new \Avereo\Connect\Config('local',true,null,'','','ACCOUNT_UI',1800,43200),$repo,null,null,$notifier,null,$service);
$app->handle(\Avereo\Connect\Http\Request::fromGlobals(),new \Avereo\Connect\Security\AuthContext(1,time(),'owner'),'local-ui-csrf',static fn()=>null)->emit();
