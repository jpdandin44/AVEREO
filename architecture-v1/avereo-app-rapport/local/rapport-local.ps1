[CmdletBinding()]
param(
    [ValidateSet("up", "oauth-up", "token-up", "down", "restart", "build", "health", "logs", "ps")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"

$AppRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $PSScriptRoot ".env"
$ConfigFile = Join-Path $PSScriptRoot "config.php"
$TokenConfigExample = Join-Path $PSScriptRoot "config.example.php"
$OAuthConfigExample = Join-Path $PSScriptRoot "config.oauth.example.php"
$GatewayComposeFile = Join-Path (Split-Path -Parent $AppRoot) "avereo-platform\infra\local-gateway\docker-compose.yml"
$AppUrl = "http://rapport.avereo.localhost"
$AdminerUrl = "http://rapport.avereo.localhost:8101"
$OAuthMockUrl = "http://oauth-rapport.avereo.localhost:8102"
$RequiredPorts = @(8100, 3310, 8101, 8102)

function Test-LocalCommand {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-NpmCommand {
    foreach ($name in @("npm.cmd", "npm")) {
        if (Test-LocalCommand $name) {
            return $name
        }
    }
    throw "npm is required. Install Node.js 20 or newer before starting Rapport."
}

function Invoke-Checked {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList = @()
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($ArgumentList -join ' ')"
    }
}

function New-RandomSecret {
    $bytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    } finally {
        $generator.Dispose()
    }
    return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Ensure-LocalSecrets {
    if (Test-Path -LiteralPath $EnvFile) {
        return
    }

    $lines = @(
        "RAPPORT_DB_NAME=avereo_rapport",
        "RAPPORT_DB_USER=avereo_rapport",
        "RAPPORT_DB_PASSWORD=$(New-RandomSecret)",
        "RAPPORT_DB_ROOT_PASSWORD=$(New-RandomSecret)",
        "RAPPORT_API_TOKEN=$(New-RandomSecret)"
    )
    [System.IO.File]::WriteAllLines($EnvFile, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Created ignored local secrets in local/.env."
}

function Get-LocalSecrets {
    Ensure-LocalSecrets
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $EnvFile) {
        if ($line -match '^([^#=]+)=(.*)$') {
            $values[$matches[1]] = $matches[2]
        }
    }
    return $values
}

function Use-LocalConfig {
    param(
        [ValidateSet("token", "oauth")]
        [string]$Mode
    )

    $secrets = Get-LocalSecrets
    $source = if ($Mode -eq "oauth") { $OAuthConfigExample } else { $TokenConfigExample }
    $content = Get-Content -LiteralPath $source -Raw
    $content = $content.Replace("CHANGE_ME_DB_NAME", $secrets.RAPPORT_DB_NAME)
    $content = $content.Replace("CHANGE_ME_DB_USER", $secrets.RAPPORT_DB_USER)
    $content = $content.Replace("CHANGE_ME_DB_PASSWORD", $secrets.RAPPORT_DB_PASSWORD)
    $content = $content.Replace("CHANGE_ME_API_TOKEN", $secrets.RAPPORT_API_TOKEN)
    [System.IO.File]::WriteAllText($ConfigFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Configured ignored local/config.php for $Mode mode."
}

function Assert-Docker {
    if (-not (Test-LocalCommand "docker")) {
        throw "Docker CLI was not found. Install and start Docker Desktop, then rerun this script."
    }
    Invoke-Checked "docker" @("compose", "version")
}

function Assert-PortsAvailable {
    $ownedContainers = & docker ps --filter "name=avereo-rapport-" --format "{{.Names}}"
    if ($LASTEXITCODE -eq 0 -and $ownedContainers) {
        return
    }

    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue
    foreach ($port in $RequiredPorts) {
        if ($listeners | Where-Object LocalPort -eq $port) {
            throw "Port $port is already in use. Stop the conflicting service or adjust Rapport ports before continuing."
        }
    }
}

function Ensure-LocalGateway {
    if (-not (Test-Path -LiteralPath $GatewayComposeFile)) {
        throw "The shared AVEREO local gateway compose file is missing: $GatewayComposeFile"
    }

    $gatewayRunning = & docker ps --filter "name=^avereo-local-gateway$" --format "{{.Names}}"
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the shared AVEREO local gateway."
    }
    if (-not $gatewayRunning) {
        $listener = Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue
        if ($listener) {
            throw "Port 80 is already in use. Stop the conflicting local HTTP service before starting Rapport."
        }
    }

    Invoke-Checked "docker" @("compose", "-f", $GatewayComposeFile, "-p", "avereo-local-gateway", "up", "-d")
}

function Build-Frontend {
    param([bool]$OnlineSyncEnabled = $false)

    $npm = Get-NpmCommand
    $previousOnlineSync = $env:VITE_ENABLE_ONLINE_SYNC
    $env:VITE_ENABLE_ONLINE_SYNC = if ($OnlineSyncEnabled) { "true" } else { "false" }
    Push-Location (Join-Path $AppRoot "frontend")
    try {
        if (-not (Test-Path -LiteralPath "node_modules")) {
            if (Test-Path -LiteralPath "package-lock.json") {
                Invoke-Checked $npm @("ci")
            } else {
                Invoke-Checked $npm @("install")
            }
        }
        Invoke-Checked $npm @("run", "build")
    } finally {
        Pop-Location
        if ($null -eq $previousOnlineSync) {
            Remove-Item Env:VITE_ENABLE_ONLINE_SYNC -ErrorAction SilentlyContinue
        } else {
            $env:VITE_ENABLE_ONLINE_SYNC = $previousOnlineSync
        }
    }
}

function Wait-RapportHealth {
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            $health = Invoke-RestMethod -TimeoutSec 5 -Uri "$AppUrl/api/health.php"
            if ($health.ok -and $health.app -eq "rapport") {
                Write-Host "Rapport healthcheck: OK"
                return
            }
        } catch {
            if ($attempt -eq 30) {
                throw "Rapport did not become healthy at $AppUrl/api/health.php."
            }
        }
        Start-Sleep -Seconds 2
    }
    throw "Rapport did not become healthy at $AppUrl/api/health.php."
}

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)
    Push-Location $AppRoot
    try {
        Invoke-Checked "docker" (@("compose", "--env-file", "local/.env", "-f", "docker-compose.local.yml", "-p", "avereo-rapport") + $ComposeArgs)
    } finally {
        Pop-Location
    }
}

function Start-Rapport {
    param([ValidateSet("token", "oauth")][string]$Mode)
    Assert-Docker
    Ensure-LocalGateway
    Assert-PortsAvailable
    Use-LocalConfig $Mode
    Build-Frontend -OnlineSyncEnabled $true
    if ($Mode -eq "oauth") {
        Invoke-Compose --profile oauth up --build -d
    } else {
        Invoke-Compose --profile oauth stop rapport-oauth-mock
        Invoke-Compose up --build -d
    }
    Wait-RapportHealth
    Write-Host "Rapport local: $AppUrl"
    Write-Host "Adminer local: $AdminerUrl"
    if ($Mode -eq "oauth") {
        Write-Host "OAuth mock:    $OAuthMockUrl"
    }
    Write-Host "API health:    $AppUrl/api/health.php"
}

switch ($Command) {
    "up" { Start-Rapport token }
    "token-up" { Start-Rapport token }
    "oauth-up" { Start-Rapport oauth }
    "restart" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth down
        Start-Rapport token
    }
    "build" { Build-Frontend -OnlineSyncEnabled $false }
    "down" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth down
    }
    "logs" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth logs -f rapport-web
    }
    "ps" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth ps
    }
    "health" {
        $health = Invoke-RestMethod -TimeoutSec 15 -Uri "$AppUrl/api/health.php"
        $health | ConvertTo-Json -Depth 5
    }
}
