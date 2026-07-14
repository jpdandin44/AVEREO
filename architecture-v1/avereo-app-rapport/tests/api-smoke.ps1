[CmdletBinding()]
param([string]$BaseUrl = "http://rapport.avereo.localhost")

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $AppRoot "local/.env"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw "Run local/rapport-local.ps1 token-up before this smoke test."
}

$values = @{}
foreach ($line in Get-Content -LiteralPath $EnvFile) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $values[$matches[1]] = $matches[2]
    }
}

$token = $values.RAPPORT_API_TOKEN
if (-not $token) {
    throw "RAPPORT_API_TOKEN is missing from the ignored local environment."
}

$health = Invoke-RestMethod -TimeoutSec 15 -Uri "$BaseUrl/api/health.php"
if (-not $health.ok -or $health.app -ne "rapport") {
    throw "Unexpected health response."
}

$auth = Invoke-RestMethod -TimeoutSec 15 -Uri "$BaseUrl/api/auth.php?action=config"
if ($auth.auth.mode -ne "api_token") {
    throw "Run Rapport in token mode before this smoke test."
}

$headers = @{ Authorization = "Bearer $token" }
$endpoint = "$BaseUrl/api/reports.php"
$reference = "SMOKE-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))"
$body = @{
    report = @{
        titre = "Rapport smoke test"
        reference_dossier = $reference
        adresse_logement = "Adresse de test"
        observations = @(@{ id = "smoke"; observations = "Test"; photos = @() })
    }
} | ConvertTo-Json -Depth 10

$id = $null
try {
    $created = Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri $endpoint -Headers $headers -ContentType "application/json" -Body $body
    $id = $created.report.id
    $loaded = Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?id=$id" -Headers $headers
    $listed = Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?limit=100" -Headers $headers

    if (-not $loaded.ok -or $loaded.report.payload.reference_dossier -ne $reference) {
        throw "Created report could not be loaded."
    }
    if (-not ($listed.reports | Where-Object id -eq $id)) {
        throw "Created report is missing from the list."
    }

    $updatedBody = @{
        id = $id
        report = @{
            titre = "Rapport smoke test mis a jour"
            reference_dossier = $reference
            adresse_logement = "Adresse de test"
            observations = @(@{ id = "smoke"; observations = "Mise a jour"; photos = @() })
        }
    } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -TimeoutSec 15 -Method Post -Uri $endpoint -Headers $headers -ContentType "application/json" -Body $updatedBody | Out-Null
    $updated = Invoke-RestMethod -TimeoutSec 15 -Uri "${endpoint}?id=$id" -Headers $headers
    if ($updated.report.payload.titre -ne "Rapport smoke test mis a jour") {
        throw "Updated report could not be loaded."
    }

    Write-Host "TOKEN_SMOKE_OK idLength=$($id.Length)"
} finally {
    if ($id) {
        Invoke-RestMethod -TimeoutSec 15 -Method Delete -Uri "${endpoint}?id=$id" -Headers $headers | Out-Null
    }
}
