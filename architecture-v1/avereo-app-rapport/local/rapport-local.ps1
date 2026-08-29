[CmdletBinding()]
param(
    [ValidateSet("up", "oauth-up", "token-up", "gateway-up", "gateway-down", "down", "restart", "build", "health", "logs", "ps")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"

$AppRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $PSScriptRoot ".env"
$ConfigFile = Join-Path $PSScriptRoot "config.php"
$TokenConfigExample = Join-Path $PSScriptRoot "config.example.php"
$OAuthConfigExample = Join-Path $PSScriptRoot "config.oauth.example.php"
$ConnectGatewayConfigExample = Join-Path $PSScriptRoot "config.gateway.example.php"
$ConnectGatewayOverride = Join-Path $PSScriptRoot "connect-gateway.override.yml"
$RapportGatewayOverride = Join-Path $PSScriptRoot "rapport-gateway.override.yml"
$ConnectGatewayState = Join-Path $PSScriptRoot ".connect-gateway-active"
$ArchitectureRoot = Split-Path -Parent $AppRoot
$ConnectRoot = Join-Path $ArchitectureRoot "avereo-app-connect"
$ConnectComposeFile = Join-Path $ConnectRoot "compose.c7.yaml"
$GatewayComposeFile = Join-Path (Split-Path -Parent $AppRoot) "avereo-platform\infra\local-gateway\docker-compose.yml"
$AppUrl = "http://rapport.avereo.localhost"
$TechnicalAppUrl = "http://127.0.0.1:8100"
$ConnectUrl = "http://127.0.0.1:8080"
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
    $lines = if (Test-Path -LiteralPath $EnvFile) {
        @(Get-Content -LiteralPath $EnvFile)
    } else {
        @(
            "RAPPORT_DB_NAME=avereo_rapport",
            "RAPPORT_DB_USER=avereo_rapport",
            "RAPPORT_DB_PASSWORD=$(New-RandomSecret)",
            "RAPPORT_DB_ROOT_PASSWORD=$(New-RandomSecret)",
            "RAPPORT_API_TOKEN=$(New-RandomSecret)"
        )
    }
    if (-not ($lines | Where-Object { $_ -match '^RAPPORT_CONNECT_GATEWAY_SECRET=' })) {
        $lines += "RAPPORT_CONNECT_GATEWAY_SECRET=$(New-RandomSecret)"
    }
    if (-not ($lines | Where-Object { $_ -match '^RAPPORT_LOCAL_INSTANCE_ID=' })) {
        $lines += "RAPPORT_LOCAL_INSTANCE_ID=$(New-RandomSecret)"
    }
    [System.IO.File]::WriteAllLines($EnvFile, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Local secrets are ready in ignored local/.env."
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
        [ValidateSet("token", "oauth", "gateway")]
        [string]$Mode
    )

    $secrets = Get-LocalSecrets
    $source = switch ($Mode) {
        "oauth" { $OAuthConfigExample }
        "gateway" { $ConnectGatewayConfigExample }
        default { $TokenConfigExample }
    }
    $content = Get-Content -LiteralPath $source -Raw
    $content = $content.Replace("CHANGE_ME_DB_NAME", $secrets.RAPPORT_DB_NAME)
    $content = $content.Replace("CHANGE_ME_DB_USER", $secrets.RAPPORT_DB_USER)
    $content = $content.Replace("CHANGE_ME_DB_PASSWORD", $secrets.RAPPORT_DB_PASSWORD)
    $content = $content.Replace("CHANGE_ME_API_TOKEN", $secrets.RAPPORT_API_TOKEN)
    $content = $content.Replace("CHANGE_ME_CONNECT_GATEWAY_SECRET", $secrets.RAPPORT_CONNECT_GATEWAY_SECRET)
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

function Invoke-RapportGatewayCompose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)
    if (-not (Test-Path -LiteralPath $RapportGatewayOverride)) {
        throw "The Rapport gateway database override is missing: $RapportGatewayOverride"
    }
    Push-Location $AppRoot
    try {
        Invoke-Checked "docker" (@(
            "compose",
            "--env-file", "local/.env",
            "-f", "docker-compose.local.yml",
            "-f", "local/rapport-gateway.override.yml",
            "-p", "avereo-rapport"
        ) + $ComposeArgs)
    } finally {
        Pop-Location
    }
}

function Invoke-ConnectCompose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)
    if (-not (Test-Path -LiteralPath $ConnectComposeFile)) {
        throw "The CONNECT local compose file is missing: $ConnectComposeFile"
    }
    Invoke-Checked "docker" (@("compose", "-f", $ConnectComposeFile, "-p", "avereo-connect-c7") + $ComposeArgs)
}

function Invoke-ConnectGatewayCompose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)
    if (-not (Test-Path -LiteralPath $ConnectGatewayOverride)) {
        throw "The Rapport CONNECT override is missing: $ConnectGatewayOverride"
    }
    Invoke-Checked "docker" (@(
        "compose",
        "--env-file", $EnvFile,
        "-f", $ConnectComposeFile,
        "-f", $ConnectGatewayOverride,
        "-p", "avereo-connect-c7"
    ) + $ComposeArgs)
}

function Start-ConnectGateway {
    Invoke-ConnectCompose up --detach database
    Invoke-ConnectCompose run --rm php php bin/migrate.php --direction=up
    Invoke-ConnectGatewayCompose up --detach --build --force-recreate web
    [System.IO.File]::WriteAllText($ConnectGatewayState, "rapport`n", [System.Text.UTF8Encoding]::new($false))
}

function Restore-ConnectLocalPlaceholders {
    if (-not (Test-Path -LiteralPath $ConnectGatewayState)) {
        return
    }

    $runningServices = @(& docker compose -f $ConnectComposeFile -p avereo-connect-c7 ps --status running --services)
    if ($LASTEXITCODE -eq 0 -and $runningServices -contains "database") {
        Invoke-ConnectCompose up --detach --build --force-recreate web
        Write-Host "CONNECT local restored to its default placeholder catalogue."
    }
    Remove-Item -LiteralPath $ConnectGatewayState -Force -ErrorAction SilentlyContinue
}

function Start-Rapport {
    param([ValidateSet("token", "oauth", "gateway")][string]$Mode)
    Assert-Docker
    if ($Mode -ne "gateway") {
        Restore-ConnectLocalPlaceholders
    }
    Ensure-LocalGateway
    Assert-PortsAvailable
    Use-LocalConfig $Mode
    Build-Frontend -OnlineSyncEnabled $true
    if ($Mode -eq "oauth") {
        Invoke-Compose --profile oauth up --build --detach
    } elseif ($Mode -eq "gateway") {
        Invoke-Compose --profile oauth stop rapport-oauth-mock
        Invoke-RapportGatewayCompose up --build --detach
    } else {
        Invoke-Compose --profile oauth stop rapport-oauth-mock
        Invoke-Compose up --build --detach
    }
    Wait-RapportHealth
    if ($Mode -eq "gateway") {
        Start-ConnectGateway
    }
    Write-Host "Rapport local: $AppUrl"
    Write-Host "Rapport direct: $TechnicalAppUrl"
    Write-Host "Adminer local: $AdminerUrl"
    if ($Mode -eq "oauth") {
        Write-Host "OAuth mock:    $OAuthMockUrl"
    }
    if ($Mode -eq "gateway") {
        Write-Host "AVEREO CONNECT: $ConnectUrl"
        Write-Host "Open CONNECT, choose a local profile, then launch Rapport from the catalogue."
    }
    Write-Host "API health:    $AppUrl/api/health.php"
}

switch ($Command) {
    "up" { Start-Rapport token }
    "token-up" { Start-Rapport token }
    "oauth-up" { Start-Rapport oauth }
    "gateway-up" { Start-Rapport gateway }
    "gateway-down" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth down
        Restore-ConnectLocalPlaceholders
    }
    "restart" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth down
        Restore-ConnectLocalPlaceholders
        Start-Rapport token
    }
    "build" { Build-Frontend -OnlineSyncEnabled $false }
    "down" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth down
        Restore-ConnectLocalPlaceholders
    }
    "logs" {
        Assert-Docker
        Ensure-LocalSecrets
        Invoke-Compose --profile oauth logs --follow rapport-web
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
