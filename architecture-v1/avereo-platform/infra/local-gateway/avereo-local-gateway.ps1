[CmdletBinding()]
param(
    [ValidateSet("up", "down", "logs", "ps")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"
$ComposeFile = Join-Path $PSScriptRoot "docker-compose.yml"
$ProjectName = "avereo-local-gateway"

function Invoke-Checked {
    param([string[]]$Arguments)

    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed with exit code $LASTEXITCODE."
    }
}

function Assert-Docker {
    if ($null -eq (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI was not found. Install and start Docker Desktop first."
    }
    Invoke-Checked @("compose", "version")
}

function Invoke-GatewayCompose {
    param([string[]]$Arguments)

    Invoke-Checked (@("compose", "-f", $ComposeFile, "-p", $ProjectName) + $Arguments)
}

function Assert-PortAvailable {
    $gatewayRunning = & docker ps --filter "name=^avereo-local-gateway$" --format "{{.Names}}"
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect Docker containers."
    }
    if ($gatewayRunning) {
        return
    }

    $listener = Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue
    if ($listener) {
        throw "Port 80 is already in use. Stop the conflicting local HTTP service before starting the AVEREO gateway."
    }
}

Assert-Docker

switch ($Command) {
    "up" {
        Assert-PortAvailable
        Invoke-GatewayCompose @("up", "-d")
        Write-Host "AVEREO local gateway: http://*.avereo.localhost"
    }
    "down" { Invoke-GatewayCompose @("down") }
    "logs" { Invoke-GatewayCompose @("logs", "-f", "gateway") }
    "ps" { Invoke-GatewayCompose @("ps") }
}
