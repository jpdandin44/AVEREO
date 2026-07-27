<?php

declare(strict_types=1);

namespace Avereo\Connect\Identity;

use Avereo\Connect\Config;
use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;
use Avereo\Connect\Http\Response;
use Avereo\Connect\Security\OAuthTransactionStore;
use Avereo\Connect\Security\SessionManager;

final class OAuthFlow
{
    public function __construct(
        private readonly Config $config,
        private readonly SessionManager $session,
        private readonly ?OAuthTransactionStore $transactions = null,
    ) {
    }

    public function begin(Request $request): Response
    {
        $state = self::randomToken(32);
        $nonce = self::randomToken(32);
        $verifier = self::randomToken(64);
        $challenge = self::base64Url(hash('sha256', $verifier, true));
        $this->session->beginOauth($state, $nonce, $verifier);
        if ($this->transactions !== null) {
            $binding = $this->session->ensureOauthBinding();
            $this->transactions->save($state, $nonce, $verifier, $binding);
        }

        $query = http_build_query([
            'response_type' => 'code',
            'client_id' => $this->config->oauthClientId,
            'redirect_uri' => $this->config->oauthRedirectUri,
            'scope' => $this->config->oauthScopes,
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ], '', '&', PHP_QUERY_RFC3986);

        $authorizeUrl = $this->config->oauthAuthorizeUrl . '?' . $query;
        if ($request->header('x-avereo-navigation') === 'json') {
            return Response::success(['authorizeUrl' => $authorizeUrl], $request->requestId);
        }
        return Response::redirect($authorizeUrl, $request->requestId);
    }

    public function complete(Request $request): Response
    {
        if (isset($request->query['error'])) {
            throw new ApiException(401, 'OAUTH_AUTHORIZATION_REFUSED', 'L’autorisation Drupal a été refusée.');
        }

        $code = $this->boundedQueryString($request, 'code', 2048);
        $state = $this->boundedQueryString($request, 'state', 256);
        try {
            $transaction = $this->session->consumeOauth($state);
            $this->transactions?->discard($state);
        } catch (ApiException $exception) {
            if (
                $exception->errorCode !== 'OAUTH_TRANSACTION_MISSING'
                || $this->transactions === null
                || ($binding = $this->session->oauthBinding()) === null
            ) {
                throw $exception;
            }
            $transaction = $this->transactions->consume($state, $binding);
        }
        $token = $this->postForm($this->config->oauthTokenUrl, [
            'grant_type' => 'authorization_code',
            'client_id' => $this->config->oauthClientId,
            'client_secret' => $this->config->oauthClientSecret,
            'redirect_uri' => $this->config->oauthRedirectUri,
            'code' => $code,
            'code_verifier' => $transaction['verifier'],
        ]);

        $accessToken = $token['access_token'] ?? null;
        $idToken = $token['id_token'] ?? null;
        if (!is_string($accessToken) || $accessToken === '' || !is_string($idToken) || $idToken === '') {
            throw new ApiException(502, 'OAUTH_TOKEN_INVALID', 'La réponse de jeton Drupal est incomplète.');
        }

        $claims = $this->verifyIdToken($idToken, $transaction['nonce']);
        $profile = $this->getJson($this->config->oauthUserinfoUrl, $accessToken);
        $subject = $claims['sub'] ?? null;
        if (!is_string($subject) || $subject === '' || strlen($subject) > 191) {
            throw new ApiException(502, 'OAUTH_SUBJECT_INVALID', 'Le subject Drupal est absent ou invalide.');
        }
        if (isset($profile['sub']) && (!is_string($profile['sub']) || !hash_equals($subject, $profile['sub']))) {
            throw new ApiException(502, 'OAUTH_SUBJECT_MISMATCH', 'Les profils OAuth ne désignent pas le même compte.');
        }

        $this->session->establishIdentity($subject);
        $this->session->clearOauthBinding();
        return Response::redirect($this->config->oauthSuccessUrl, $request->requestId);
    }

    /** @return array<string, mixed> */
    private function verifyIdToken(string $jwt, string $expectedNonce): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_INVALID', 'Le jeton d’identité Drupal est invalide.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $header = $this->decodeJsonPart($encodedHeader);
        $claims = $this->decodeJsonPart($encodedPayload);
        if (($header['alg'] ?? null) !== 'RS256') {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_ALGORITHM', 'L’algorithme de signature est refusé.');
        }

        $signature = self::base64UrlDecode($encodedSignature);
        $publicKey = file_get_contents($this->config->oauthPublicKeyPath);
        if ($publicKey === false || openssl_verify($encodedHeader . '.' . $encodedPayload, $signature, $publicKey, OPENSSL_ALGO_SHA256) !== 1) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_SIGNATURE', 'La signature du jeton d’identité est invalide.');
        }

        $now = time();
        $exp = $claims['exp'] ?? null;
        $iat = $claims['iat'] ?? null;
        $nbf = $claims['nbf'] ?? null;
        if (!is_int($exp) || $exp < $now - 30 || !is_int($iat) || $iat > $now + 60) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_TIME', 'La période de validité du jeton est invalide.');
        }
        if ($nbf !== null && (!is_int($nbf) || $nbf > $now + 30)) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_TIME', 'Le jeton n’est pas encore valide.');
        }
        if (($claims['iss'] ?? null) !== $this->config->oauthIssuer) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_ISSUER', 'L’émetteur du jeton est invalide.');
        }
        $audience = $claims['aud'] ?? null;
        $audiences = is_string($audience) ? [$audience] : (is_array($audience) ? $audience : []);
        if (!in_array($this->config->oauthClientId, $audiences, true)) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_AUDIENCE', 'L’audience du jeton est invalide.');
        }
        $nonce = $claims['nonce'] ?? null;
        // Simple OAuth 6.1.1 does not echo the authorization-request nonce in
        // code-flow ID tokens. The state, one-time authorization code, PKCE
        // verifier and browser-bound transaction still prevent replay. If a
        // provider emits a nonce, it must match exactly.
        if ($nonce !== null && (!is_string($nonce) || !hash_equals($expectedNonce, $nonce))) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_NONCE', 'Le nonce du jeton est invalide.');
        }

        return $claims;
    }

    /** @return array<string, mixed> */
    private function postForm(string $url, array $fields): array
    {
        return $this->requestJson($url, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($fields, '', '&', PHP_QUERY_RFC3986),
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
        ], 'token_exchange');
    }

    /** @return array<string, mixed> */
    private function getJson(string $url, string $bearerToken): array
    {
        return $this->requestJson($url, [
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer ' . $bearerToken],
        ], 'userinfo');
    }

    /** @param array<int, mixed> $options
     *  @return array<string, mixed>
     */
    private function requestJson(string $url, array $options, string $stage): array
    {
        $curl = curl_init($url);
        if ($curl === false) {
            throw new ApiException(502, 'OAUTH_UPSTREAM_UNAVAILABLE', 'Le fournisseur d’identité est indisponible.');
        }
        curl_setopt_array($curl, $options + [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $failed = $body === false || curl_errno($curl) !== 0;
        curl_close($curl);
        if ($failed || $status < 200 || $status >= 300 || !is_string($body)) {
            error_log(json_encode([
                'event' => 'oauth.upstream_failure',
                'stage' => $stage,
                'status' => $status,
                'transportError' => $failed,
            ], JSON_UNESCAPED_SLASHES));
            throw new ApiException(502, 'OAUTH_UPSTREAM_REJECTED', 'Le fournisseur d’identité a refusé la requête.');
        }
        try {
            $decoded = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            error_log(json_encode([
                'event' => 'oauth.upstream_invalid_json',
                'stage' => $stage,
                'status' => $status,
            ], JSON_UNESCAPED_SLASHES));
            throw new ApiException(502, 'OAUTH_UPSTREAM_INVALID_JSON', 'La réponse du fournisseur d’identité est invalide.');
        }
        if (!is_array($decoded)) {
            error_log(json_encode([
                'event' => 'oauth.upstream_invalid_json',
                'stage' => $stage,
                'status' => $status,
            ], JSON_UNESCAPED_SLASHES));
            throw new ApiException(502, 'OAUTH_UPSTREAM_INVALID_JSON', 'La réponse du fournisseur d’identité est invalide.');
        }
        return $decoded;
    }

    /** @return array<string, mixed> */
    private function decodeJsonPart(string $encoded): array
    {
        try {
            $decoded = json_decode(self::base64UrlDecode($encoded), true, 16, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_INVALID', 'Le jeton d’identité est invalide.');
        }
        if (!is_array($decoded)) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_INVALID', 'Le jeton d’identité est invalide.');
        }
        return $decoded;
    }

    private function boundedQueryString(Request $request, string $name, int $maximumLength): string
    {
        $value = $request->query[$name] ?? null;
        if (!is_string($value) || $value === '' || strlen($value) > $maximumLength) {
            throw new ApiException(400, 'OAUTH_CALLBACK_INVALID', 'Le callback OAuth est incomplet ou invalide.');
        }
        return $value;
    }

    private static function randomToken(int $bytes): string
    {
        return self::base64Url(random_bytes($bytes));
    }

    private static function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $padding = (4 - strlen($value) % 4) % 4;
        $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);
        if ($decoded === false) {
            throw new ApiException(502, 'OAUTH_ID_TOKEN_INVALID', 'Le jeton d’identité est invalide.');
        }
        return $decoded;
    }
}
