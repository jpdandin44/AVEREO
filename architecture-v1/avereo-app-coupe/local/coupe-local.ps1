[CmdletBinding()]
param(
    [ValidateSet('up', 'gateway-up', 'down', 'gateway-down', 'build', 'check', 'ps', 'logs')]
    [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'
$AppRoot = Split-Path -Parent $PSScriptRoot
$ArchitectureRoot = Split-Path -Parent $AppRoot
$RapportRoot = Join-Path $ArchitectureRoot 'avereo-app-rapport'
$ConnectRoot = Join-Path $ArchitectureRoot 'avereo-app-connect'
$EnvFile = Join-Path $PSScriptRoot '.env'
$AppCompose = Join-Path $AppRoot 'docker-compose.local.yml'

function Invoke-Checked {
    param([string]$FilePath, [string[]]$ArgumentList = @())
    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) { throw "$FilePath failed (exit $LASTEXITCODE)." }
}

function Initialize-CoupeConfig {
    if (-not (Test-Path -LiteralPath $EnvFile)) {
        $bytes = New-Object byte[] 32
        $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
        $secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
        [IO.File]::WriteAllText($EnvFile, "COUPE_CONNECT_GATEWAY_SECRET=$secret`n", [Text.UTF8Encoding]::new($false))
    }
    $matchesInFile = @(Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match '^COUPE_CONNECT_GATEWAY_SECRET=' })
    if ($matchesInFile.Count -ne 1 -or $matchesInFile[0] -notmatch '^COUPE_CONNECT_GATEWAY_SECRET=([A-Za-z0-9_-]{43,128})$') {
        throw 'Invalid local/.env: expected one generated COUPE_CONNECT_GATEWAY_SECRET. Preserve the existing file and check it locally.'
    }
    $secret = $Matches[1]
    $template = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'config.gateway.example.php') -Raw -Encoding UTF8
    $config = $template.Replace('CHANGE_ME_CONNECT_GATEWAY_SECRET', $secret)
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'config.php'), $config, [Text.UTF8Encoding]::new($false))
    Write-Host 'Coupe configuration ready in ignored local files. No secret is printed.'
}

function Build-Coupe {
    Push-Location (Join-Path $AppRoot 'frontend')
    try {
        if (-not (Test-Path -LiteralPath 'node_modules')) { Invoke-Checked 'npm.cmd' @('ci') }
        Invoke-Checked 'npm.cmd' @('run', 'build')
    } finally { Pop-Location }
}

function Invoke-CoupeCompose {
    param([string[]]$ComposeArguments)
    Invoke-Checked 'docker' (@('compose', '-f', $AppCompose, '-p', 'avereo-coupe-local') + $ComposeArguments)
}

function Set-ConnectCatalogue {
    param([bool]$IncludeCoupe)
    $rapportEnv = Join-Path $RapportRoot 'local/.env'
    $rapportOverride = Join-Path $RapportRoot 'local/connect-gateway.override.yml'
    foreach ($required in @($rapportEnv, $rapportOverride)) {
        if (-not (Test-Path -LiteralPath $required)) { throw "Missing Rapport local dependency: $required" }
    }
    $arguments = @('compose', '--env-file', $rapportEnv)
    if ($IncludeCoupe) { $arguments += @('--env-file', $EnvFile) }
    $arguments += @('-f', (Join-Path $ConnectRoot 'compose.c7.yaml'), '-f', $rapportOverride)
    if ($IncludeCoupe) { $arguments += @('-f', (Join-Path $PSScriptRoot 'connect-gateway.override.yml')) }
    $arguments += @('-p', 'avereo-connect-c7', 'up', '--detach', '--build', '--force-recreate', 'web')
    Invoke-Checked 'docker' $arguments
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/v1/health' -TimeoutSec 2
            if ($health.data.status -eq 'ok' -and $health.data.service -eq 'avereo-connect-api' -and $health.data.database -eq 'ok') {
                return
            }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    throw 'Local CONNECT did not become healthy. Check its web logs before testing.'
}

function Start-Coupe {
    Invoke-Checked 'docker' @('info', '--format', '{{.ServerVersion}}')
    Initialize-CoupeConfig
    Build-Coupe
    Invoke-CoupeCompose @('up', '--detach', '--build', '--wait', '--wait-timeout', '60')
    # Rapport owns its existing stack and migrations; reuse the merged launcher.
    Invoke-Checked 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $RapportRoot 'local/rapport-local.ps1'), 'gateway-up')
    Set-ConnectCatalogue -IncludeCoupe $true
    Write-Host 'Open http://127.0.0.1:8080/ and choose Client local or Administrateur local.'
    Write-Host 'Rapport: http://127.0.0.1:8100/ ; Coupe: http://127.0.0.1:8200/ (launch from CONNECT).'
    Write-Host 'Coupe uses local project export/import. Its online database is not enabled.'
}

function Stop-Coupe {
    $connectCompose = Join-Path $ConnectRoot 'compose.c7.yaml'
    $running = @(& docker compose -f $connectCompose -p avereo-connect-c7 ps --status running --services)
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect local CONNECT; no service was stopped.' }
    if ($running -contains 'database') {
        Set-ConnectCatalogue -IncludeCoupe $false
        Write-Host 'CONNECT restored to real Rapport and the Coupe placeholder.'
    }
    Invoke-CoupeCompose @('down')
}

switch ($Command) {
    'up' { Start-Coupe }
    'gateway-up' { Start-Coupe }
    'down' { Stop-Coupe }
    'gateway-down' { Stop-Coupe }
    'build' { Build-Coupe }
    'check' { Invoke-Checked 'node' @((Join-Path $AppRoot 'tests/local-web.mjs')) }
    'ps' { Invoke-CoupeCompose @('ps') }
    'logs' { Invoke-CoupeCompose @('logs', '--follow', 'web') }
}
