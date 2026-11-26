# Pile locale AVEREO Vision (Docker Desktop requis). Développement seulement.
#   powershell -ExecutionPolicy Bypass -File .\local\vision-local.ps1 <action>
# Actions : up | down | health | migrate | test | logs | ps | reset
# -Php 8.3 : reconstruit l'API avec PHP 8.3, version de l'hébergement O2Switch (préproduction) ; 8.4 par défaut.
param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'down', 'health', 'migrate', 'test', 'logs', 'ps', 'reset')]
    [string]$Action = 'up',
    [ValidateSet('8.3', '8.4')]
    [string]$Php = '8.4'
)

$ErrorActionPreference = 'Stop'
$env:VISION_PHP_VERSION = $Php
$LocalDir = $PSScriptRoot
$Compose = Join-Path $LocalDir 'docker-compose.local.yml'
$EnvFile = Join-Path $LocalDir '.env'
$ConfigFile = Join-Path $LocalDir 'config.php'
$ConfigExample = Join-Path $LocalDir 'config.example.php'

function New-Secret([int]$Bytes = 24) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ([Convert]::ToBase64String($buffer)).Replace('+', 'a').Replace('/', 'b').Replace('=', 'c')
}

function Initialize-LocalSecrets {
    if (-not (Test-Path $EnvFile)) {
        $content = "VISION_DB_PASSWORD=$(New-Secret)`nVISION_DB_ROOT_PASSWORD=$(New-Secret)`n"
        [System.IO.File]::WriteAllText($EnvFile, $content, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host 'local/.env créé (secrets aléatoires, ignoré par git).'
    }
    if (-not (Test-Path $ConfigFile)) {
        $dbPassword = ((Get-Content $EnvFile | Where-Object { $_ -like 'VISION_DB_PASSWORD=*' }) -replace '^VISION_DB_PASSWORD=', '')
        $config = Get-Content $ConfigExample -Raw
        $config = $config.Replace('__VISION_DB_PASSWORD__', $dbPassword)
        $config = $config.Replace('__VISION_API_TOKEN__', (New-Secret 32))
        $config = $config.Replace('__VISION_LAUNCH_SECRET__', (New-Secret 32))
        $config = $config.Replace("'admin_user_ids' => [],", "'admin_user_ids' => ['1'],")
        [System.IO.File]::WriteAllText($ConfigFile, $config, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host 'local/config.php créé (secrets aléatoires, ignoré par git).'
    }
    # Ajouter la clé non secrète aux configurations locales déjà générées, sans renouveler leurs secrets.
    $existingConfig = Get-Content -LiteralPath $ConfigFile -Raw -Encoding UTF8
    if ($existingConfig -notmatch "'media_directory'\s*=>") {
        $existingConfig = $existingConfig.Replace('return [', "return [`n    'media_directory' => '/var/lib/avereo/vision/medias',")
        [IO.File]::WriteAllText($ConfigFile, $existingConfig, (New-Object System.Text.UTF8Encoding($false)))
    }
    $FrontendEnv = Join-Path (Split-Path $LocalDir -Parent) 'frontend\.env.development.local'
    if (-not (Test-Path $FrontendEnv)) {
        $token = ([regex]::Match((Get-Content $ConfigFile -Raw), "'api_token' => '([^']+)'")).Groups[1].Value
        [System.IO.File]::WriteAllText($FrontendEnv, "VITE_LOCAL_API_TOKEN=$token`nVITE_LOCAL_USER=1`n", (New-Object System.Text.UTF8Encoding($false)))
        Write-Host 'frontend/.env.development.local créé (lu seulement par npm run dev, ignoré par git).'
    }
}

function Invoke-Compose {
    docker compose -f $Compose --env-file $EnvFile @args
    if ($LASTEXITCODE -ne 0) { throw "docker compose a échoué (code $LASTEXITCODE)." }
}

switch ($Action) {
    'up' {
        Initialize-LocalSecrets
        Invoke-Compose up -d --build
        Invoke-Compose exec -T api sh -c 'mkdir -p /var/lib/avereo/vision/medias && chmod 700 /var/lib/avereo/vision/medias'
        Invoke-Compose exec -T api php /opt/vision/database/migrate.php
        Write-Host 'API : http://127.0.0.1:8110/api/health.php   MySQL : 127.0.0.1:3311'
    }
    'down' { Invoke-Compose down }
    'reset' {
        Invoke-Compose down -v
        Write-Host 'Pile et volumes supprimés (base de développement effacée).'
    }
    'migrate' { Invoke-Compose exec -T api php /opt/vision/database/migrate.php }
    'test' { Invoke-Compose exec -T api php /opt/vision/tests/api/run.php --strict }
    'logs' { Invoke-Compose logs --tail 100 api db }
    'ps' { Invoke-Compose ps }
    'health' {
        $reponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8110/api/health.php' -TimeoutSec 10
        Write-Host $reponse.Content
    }
}
