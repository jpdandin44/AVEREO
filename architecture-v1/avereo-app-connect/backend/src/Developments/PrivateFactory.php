<?php
declare(strict_types=1);
namespace Avereo\Connect\Developments;

use Avereo\Connect\Repository\PdoConnectRepository;

final class PrivateFactory
{
    public static function create(string $file, string $documentRoot, object $repository, array $otherSecrets = []): AuthorizationBroker
    {
        $path = realpath($file); $public = realpath($documentRoot);
        if ($path === false || $public === false || !is_file($path) || str_starts_with($path, $public . DIRECTORY_SEPARATOR)
            || !$repository instanceof PdoConnectRepository) throw new \RuntimeException('Private development configuration unavailable.');
        $c = require $path;
        if (!is_array($c) || ($c['enabled'] ?? false) !== true) throw new \RuntimeException('Private development configuration unavailable.');
        foreach (['owner_connect_id','project_key','identity_key','identity_issuer','identity_url','nonce_directory'] as $key) {
            if (!is_string($c[$key] ?? null) || $c[$key] === '') throw new \RuntimeException('Private development configuration unavailable.');
        }
        foreach ($otherSecrets as $secret) if (is_string($secret) && $secret !== ''
            && (hash_equals($secret,$c['project_key']) || hash_equals($secret,$c['identity_key']))) throw new \RuntimeException('Dedicated development keys required.');
        $u = parse_url($c['identity_url']); $issuer = parse_url($c['identity_issuer']);
        if (!is_array($u) || !is_array($issuer) || ($u['scheme'] ?? '') !== 'https' || ($issuer['scheme'] ?? '') !== 'https'
            || ($u['host'] ?? '') !== ($issuer['host'] ?? '') || ($u['port'] ?? 443) !== ($issuer['port'] ?? 443)
            || isset($u['user']) || isset($u['pass']) || isset($u['query']) || isset($u['fragment'])
            || ($u['path'] ?? '') !== '/avereo/developments/authorization') throw new \RuntimeException('Identity target refused.');
        $directory = realpath($c['nonce_directory']);
        if ($directory === false || !is_dir($directory) || $directory === $public || str_starts_with($directory, $public . DIRECTORY_SEPARATOR)
            || DIRECTORY_SEPARATOR !== '\\' && (fileperms($directory) & 0077) !== 0) throw new \RuntimeException('Private nonce directory required.');
        $claim = static function(string $nonce, int $expires) use ($directory): bool {
            if (count(glob($directory . '/*.used') ?: []) >= 4096) return false;
            $h = @fopen($directory . '/' . hash('sha256', $nonce) . '.used', 'x');
            if ($h === false) return false;
            fwrite($h, (string)$expires); fclose($h); @chmod($directory . '/' . hash('sha256', $nonce) . '.used',0600); return true;
        };
        $account = static function(string $id, int $issued) use ($repository): array {
            $p = $repository->findUserProfile((int)$id);
            $active = $repository->findIdentityStatusByDrupalSubject($p['drupalSubject']) === 'active'
                && !$repository->isAccountSessionRevoked((int)$id, $issued);
            $project = false;
            foreach ($repository->listCatalog((int)$id) as $app) if (($app['code'] ?? null) === 'projet') $project = true;
            return ['active'=>$active,'projectAccess'=>$project,'subject'=>(string)$p['drupalSubject']];
        };
        $transport = static function(array $envelope) use ($c): array {
            $h = curl_init($c['identity_url']); if ($h === false) throw new \RuntimeException('Identity unavailable.');
            $body = '';
            curl_setopt_array($h, [CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($envelope, JSON_THROW_ON_ERROR),
                CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],CURLOPT_FOLLOWLOCATION=>false,
                CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
                CURLOPT_WRITEFUNCTION=>static function($h,string $chunk) use (&$body): int {if(strlen($body)+strlen($chunk)>16384)return 0;$body.=$chunk;return strlen($chunk);}]);
            $ok = curl_exec($h); $status = curl_getinfo($h,CURLINFO_RESPONSE_CODE); curl_close($h);
            if ($ok === false || $status !== 200) throw new \RuntimeException('Identity unavailable.');
            $reply = json_decode($body,true,16,JSON_THROW_ON_ERROR); if(!is_array($reply))throw new \RuntimeException('Identity unavailable.'); return $reply;
        };
        return new AuthorizationBroker($c['owner_connect_id'],$c['project_key'],$c['identity_key'],$c['identity_issuer'],$account,$transport,$claim);
    }
}
