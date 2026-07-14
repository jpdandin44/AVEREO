[CmdletBinding()]
param([string]$BaseUrl = "http://rapport.avereo.localhost")

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Web

function ConvertTo-Base64Url {
    param([byte[]]$Bytes)
    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-TestToken {
    param([string]$MockUser)

    $random = New-Object byte[] 48
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($random)
    } finally {
        $generator.Dispose()
    }
    $verifier = ConvertTo-Base64Url $random
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $challenge = ConvertTo-Base64Url ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($verifier)))
    } finally {
        $sha.Dispose()
    }
    $state = [Guid]::NewGuid().ToString("N")
    $redirectUri = "$BaseUrl/auth/callback/"
    $authorizeUrl = $script:authConfig.auth.authorizeUrl
    $query = @{
        response_type = "code"
        client_id = $script:authConfig.auth.clientId
        redirect_uri = $redirectUri
        scope = $script:authConfig.auth.scope
        state = $state
        code_challenge = $challenge
        code_challenge_method = "S256"
        mock_user = $MockUser
    }
    $authorizeUri = $authorizeUrl + "?" + (($query.GetEnumerator() | ForEach-Object {
        "$([Uri]::EscapeDataString($_.Key))=$([Uri]::EscapeDataString([string]$_.Value))"
    }) -join "&")

    $request = [System.Net.HttpWebRequest]::Create($authorizeUri)
    $request.AllowAutoRedirect = $false
    $request.Timeout = 15000
    $authorization = $request.GetResponse()
    try {
        if ([int]$authorization.StatusCode -ne 302) {
            throw "OAuth mock did not return a redirect."
        }
        $callback = [Uri]$authorization.Headers["Location"]
    } finally {
        $authorization.Close()
    }
    $callbackQuery = [System.Web.HttpUtility]::ParseQueryString($callback.Query)
    if ($callback.GetLeftPart([System.UriPartial]::Path) -ne $redirectUri.TrimEnd("/") -and $callback.GetLeftPart([System.UriPartial]::Path) -ne $redirectUri) {
        throw "OAuth mock returned an unexpected callback."
    }
    if ($callbackQuery["state"] -ne $state -or -not $callbackQuery["code"]) {
        throw "OAuth state or authorization code is invalid."
    }

    $body = @{
        code = $callbackQuery["code"]
        codeVerifier = $verifier
        redirectUri = $redirectUri
    } | ConvertTo-Json
    $response = Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri "$BaseUrl/api/auth.php?action=token" -ContentType "application/json" -Body $body
    return $response.token.accessToken
}

$script:authConfig = Invoke-RestMethod -TimeoutSec 15 -Uri "$BaseUrl/api/auth.php?action=config"
if ($script:authConfig.auth.mode -ne "drupal_oauth" -or -not $script:authConfig.auth.configured) {
    throw "Run local/rapport-local.ps1 oauth-up before this isolation test."
}

$token1 = Get-TestToken "user-1"
$token2 = Get-TestToken "user-2"
$adminToken = Get-TestToken "admin"
$otherClientToken = Get-TestToken "other-client"
$headers1 = @{ Authorization = "Bearer $token1" }
$headers2 = @{ Authorization = "Bearer $token2" }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$otherClientHeaders = @{ Authorization = "Bearer $otherClientToken" }
$endpoint = "$BaseUrl/api/reports.php"
$body = @{
    report = @{
        titre = "Rapport isolation test"
        reference_dossier = "OAUTH-ISOLATION"
        adresse_logement = "Adresse de test"
        observations = @(@{ id = "isolation"; observations = "Test"; photos = @() })
    }
} | ConvertTo-Json -Depth 10

$wrongClientStatus = 0
try {
    Invoke-RestMethod -TimeoutSec 15 -Uri "$BaseUrl/api/auth.php?action=me" -Headers $otherClientHeaders | Out-Null
    $wrongClientStatus = 200
} catch {
    $wrongClientStatus = [int]$_.Exception.Response.StatusCode
}
if ($wrongClientStatus -ne 401) {
    throw "A token issued for another OAuth client was not rejected."
}

$wrongRedirectStatus = 0
try {
    $wrongRedirectBody = @{
        code = "invalid-code"
        codeVerifier = ("a" * 43)
        redirectUri = "$BaseUrl/auth/callback/changed"
    } | ConvertTo-Json
    Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri "$BaseUrl/api/auth.php?action=token" -ContentType "application/json" -Body $wrongRedirectBody | Out-Null
    $wrongRedirectStatus = 200
} catch {
    $wrongRedirectStatus = [int]$_.Exception.Response.StatusCode
}
if ($wrongRedirectStatus -ne 400) {
    throw "An unregistered OAuth callback was not rejected."
}

$invalidPayloadStatus = 0
try {
    $invalidBody = @{ report = @{ titre = "Invalide"; observations = "not-an-array" } } | ConvertTo-Json
    Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri $endpoint -Headers $headers1 -ContentType "application/json" -Body $invalidBody | Out-Null
    $invalidPayloadStatus = 200
} catch {
    $invalidPayloadStatus = [int]$_.Exception.Response.StatusCode
}
if ($invalidPayloadStatus -ne 422) {
    throw "Invalid report payload was not rejected."
}

$id = $null
try {
    $created = Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri $endpoint -Headers $headers1 -ContentType "application/json" -Body $body
    $id = $created.report.id
    $ownerRead = Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?id=$id" -Headers $headers1

    $otherStatus = 0
    try {
        Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?id=$id" -Headers $headers2 | Out-Null
        $otherStatus = 200
    } catch {
        $otherStatus = [int]$_.Exception.Response.StatusCode
    }

    $otherWriteStatus = 0
    $otherWriteBody = @{
        id = $id
        report = @{
            titre = "Ecrasement interdit"
            reference_dossier = "OAUTH-ISOLATION"
            adresse_logement = "Adresse de test"
            observations = @()
        }
    } | ConvertTo-Json -Depth 10
    try {
        Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri $endpoint -Headers $headers2 -ContentType "application/json" -Body $otherWriteBody | Out-Null
        $otherWriteStatus = 200
    } catch {
        $otherWriteStatus = [int]$_.Exception.Response.StatusCode
    }

    $adminRead = Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?id=$id" -Headers $adminHeaders
    if (-not $ownerRead.ok -or $otherStatus -ne 404 -or $otherWriteStatus -ne 403 -or -not $adminRead.ok) {
        throw "OAuth ownership isolation failed."
    }

    Write-Host "OAUTH_ISOLATION_OK otherUserReadStatus=$otherStatus otherUserWriteStatus=$otherWriteStatus wrongClientStatus=$wrongClientStatus wrongRedirectStatus=$wrongRedirectStatus"
} finally {
    if ($id) {
        Invoke-RestMethod -TimeoutSec 15 -Method Delete -Uri "${endpoint}?id=$id" -Headers $headers1 | Out-Null
    }
}
