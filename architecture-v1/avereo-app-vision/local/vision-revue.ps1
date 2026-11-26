# Recette locale AVEREO Vision (phase 1, développement local) : outillage et worktree servi sont séparés.
# La validation, elle, se fait en préproduction hébergée (docs/deploiement-mutualise.md), pas ici.
# Exemple : .\local\vision-revue.ps1 -Action up -Source 'C:\chemin avec espaces\worktree de la PR'
param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'down', 'reset', 'donnees', 'actualiser', 'etat', 'logs')]
    [string]$Action = 'up',
    [ValidateSet('recette')]
    [string]$Nom = 'recette',
    [string]$Source,
    [ValidateRange(1, 65535)]
    [int]$Port,
    [switch]$Confirmer
)

$ErrorActionPreference = 'Stop'
$LocalDir = $PSScriptRoot
$Compose = Join-Path $LocalDir 'docker-compose.revue.yml'
$Environnements = Join-Path $LocalDir 'revue\environnements'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Invoke-RevueGit([string]$Directory, [string[]]$GitArgs) {
    & git -C $Directory @GitArgs
    if ($LASTEXITCODE -ne 0) { throw "Git a échoué (code $LASTEXITCODE)." }
}

function New-RevueSecret {
    $buffer = New-Object byte[] 24
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($buffer) } finally { $random.Dispose() }
    return ([BitConverter]::ToString($buffer)).Replace('-', '').ToLowerInvariant()
}

function Read-RevueEnv([string]$Path) {
    $values = @{}
    if (Test-Path -LiteralPath $Path) {
        foreach ($line in Get-Content -Encoding UTF8 -LiteralPath $Path) {
            if ($line -match '^([A-Z_]+)=(.*)$') {
                $key = $Matches[1]
                $value = $Matches[2]
                if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2).Replace("\'", "'")
                }
                $values[$key] = $value
            }
        }
    }
    return $values
}

function New-RevueSettings([string]$Name, [string]$Root, [int]$ListenPort) {
    $directory = Join-Path $Environnements $Name
    return @{
        Nom = $Name
        SourceRoot = $Root
        SourceApp = (Join-Path $Root 'architecture-v1\avereo-app-vision').Replace('\', '/')
        Port = $ListenPort
        Directory = $directory
        EnvFile = Join-Path $directory '.env'
        ConfigFile = Join-Path $directory 'config.php'
    }
}

function Invoke-RevueCompose([hashtable]$Settings, [string[]]$ComposeArgs) {
    $variables = @{
        VISION_REVUE_SOURCE = $Settings.SourceApp
        VISION_REVUE_PORT = [string]$Settings.Port
        VISION_REVUE_NOM = $Settings.Nom
        # Les mots de passe viennent de --env-file, même si le terminal a déjà ces variables.
        VISION_DB_PASSWORD = $null
        VISION_DB_ROOT_PASSWORD = $null
    }
    $previous = @{}
    try {
        foreach ($key in $variables.Keys) {
            $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
            [Environment]::SetEnvironmentVariable($key, $variables[$key], 'Process')
        }
        & docker compose -f $Compose -p ("vision-revue-" + $Settings.Nom) --env-file $Settings.EnvFile @ComposeArgs
        if ($LASTEXITCODE -ne 0) { throw "Docker Compose a échoué (code $LASTEXITCODE)." }
    } finally {
        foreach ($key in $previous.Keys) {
            [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process')
        }
    }
}

function Initialize-Revue([hashtable]$Settings) {
    $values = Read-RevueEnv $Settings.EnvFile
    if (-not (Test-Path -LiteralPath $Settings.EnvFile) -and (Test-Path -LiteralPath $Settings.ConfigFile)) {
        throw 'Configuration partielle : config.php existe sans .env. Restaurer .env ou utiliser reset -Confirmer.'
    }
    foreach ($key in @('VISION_DB_PASSWORD', 'VISION_DB_ROOT_PASSWORD')) {
        if (-not $values.ContainsKey($key)) { $values[$key] = New-RevueSecret }
        if ($values[$key] -notmatch '^[a-zA-Z0-9]{32,}$') { throw "Valeur locale invalide pour $key ; restaurer le fichier .env." }
    }
    New-Item -ItemType Directory -Path $Settings.Directory -Force | Out-Null
    # Conserver la source et le port permet à « etat » de décrire les deux environnements sans argument -Source.
    # Les quotes simples du format dotenv préservent les espaces et les dollars des chemins Windows.
    $sourceValue = $Settings.SourceApp.Replace("'", "\'")
    $content = "VISION_DB_PASSWORD=$($values.VISION_DB_PASSWORD)`nVISION_DB_ROOT_PASSWORD=$($values.VISION_DB_ROOT_PASSWORD)`n"
    $content += "VISION_REVUE_SOURCE='$sourceValue'`nVISION_REVUE_PORT=$($Settings.Port)`nVISION_REVUE_NOM=$($Settings.Nom)`n"
    [IO.File]::WriteAllText($Settings.EnvFile, $content, $Utf8)
    if (-not (Test-Path -LiteralPath $Settings.ConfigFile)) {
        $secret = New-RevueSecret
        $cookie = 'AVEREO_VISION_GATE_' + $Settings.Nom.ToUpperInvariant()
        $config = @'
<?php

// Configuration générée pour la revue locale ; jamais publiée ni versionnée.
return [
    'environment' => 'local',
    'auth_mode' => 'connect',
    'db' => ['host' => 'db', 'port' => 3306, 'name' => 'vision', 'user' => 'vision', 'password' => '__DB_PASSWORD__'],
    'admin_user_ids' => ['900009'],
    'connect_portal_url' => 'http://127.0.0.1:__REVUE_PORT__/revue',
    'connect_launch_secret' => '__LAUNCH_SECRET__',
    'connect_launch_nonce_directory' => '/var/lib/avereo/vision/nonces',
    'connect_gate_cookie' => '__GATE_COOKIE__',
    'connect_gate_session_seconds' => 1800,
];
'@
        $config = $config.Replace('__REVUE_PORT__', [string]$Settings.Port).Replace('__DB_PASSWORD__', $values.VISION_DB_PASSWORD).Replace('__LAUNCH_SECRET__', $secret).Replace('__GATE_COOKIE__', $cookie)
        [IO.File]::WriteAllText($Settings.ConfigFile, $config, $Utf8)
        Write-Host "Configuration locale créée pour $($Settings.Nom) (secrets ignorés par Git)."
    }
}

function Assert-RevueWorktree([string]$Root) {
    $actual = [IO.Path]::GetFullPath((Invoke-RevueGit $Root @('rev-parse', '--show-toplevel')).Trim())
    if ($actual.TrimEnd('\', '/') -ne $Root.TrimEnd('\', '/')) {
        throw 'La source doit être la racine du worktree, pas un sous-dossier.'
    }
    $common = (Invoke-RevueGit $Root @('rev-parse', '--git-common-dir')).Trim()
    if (-not [IO.Path]::IsPathRooted($common)) { $common = Join-Path $Root $common }
    if ([IO.Path]::GetFullPath($common) -ne $RepoCommon) {
        throw "La source n'est pas un worktree du dépôt de cet outillage."
    }
}

function Update-RevueRecette([string]$Root) {
    if ($Root -eq $RepoRoot) { throw "La recette doit utiliser un worktree distinct du dépôt de l'outillage." }
    if (-not (Test-Path -LiteralPath $Root)) {
        Invoke-RevueGit $RepoRoot @('fetch', 'origin')
        Invoke-RevueGit $RepoRoot @('worktree', 'add', '--detach', $Root, 'origin/main')
    } else {
        Assert-RevueWorktree $Root
        if (@(Invoke-RevueGit $Root @('status', '--porcelain')).Count -gt 0) {
            throw "Actualisation refusée : le worktree de recette contient des modifications non commitées."
        }
        Invoke-RevueGit $Root @('fetch', 'origin')
        Invoke-RevueGit $Root @('checkout', '--detach', 'origin/main')
    }
    Write-Host ("Recette actualisée : " + (Invoke-RevueGit $Root @('rev-parse', 'HEAD')))
}

function Show-RevueSource([hashtable]$Settings) {
    Write-Host "Source : $($Settings.SourceRoot)"
    if (Test-Path -LiteralPath $Settings.SourceRoot) {
        $branch = (Invoke-RevueGit $Settings.SourceRoot @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
        $commit = (Invoke-RevueGit $Settings.SourceRoot @('rev-parse', '--short', 'HEAD')).Trim()
        Write-Host "Branche : $branch ; commit : $commit"
    } else { Write-Host 'Source absente : branche et commit non disponibles.' }
}

function Assert-RevuePort([hashtable]$Settings) {
    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Settings.Port -ErrorAction SilentlyContinue)
    if ($listeners.Count -eq 0) { return }
    if (Test-Path -LiteralPath $Settings.EnvFile) {
        $mapping = @()
        try { $mapping = @(Invoke-RevueCompose $Settings @('port', 'api', '80')) } catch { }
        if ($mapping -contains "127.0.0.1:$($Settings.Port)") { return }
    }
    throw "Le port $($Settings.Port) est occupé par autre chose que vision-revue-$($Settings.Nom). Choisir un autre -Port."
}

function Wait-RevueHealth([hashtable]$Settings) {
    $watch = [Diagnostics.Stopwatch]::StartNew()
    $url = "http://127.0.0.1:$($Settings.Port)/api/health.php"
    while ($watch.Elapsed.TotalSeconds -lt 30) {
        $timeout = [int][Math]::Max(1, [Math]::Min(2, [Math]::Floor(30 - $watch.Elapsed.TotalSeconds)))
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec $timeout
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        if ($watch.Elapsed.TotalSeconds -lt 29.5) { Start-Sleep -Milliseconds 500 }
    }
    throw "La santé de l'API n'est pas confirmée après 30 secondes : $url"
}

if ($Action -eq 'reset' -and -not $Confirmer) { throw 'reset efface la base locale : ajouter -Confirmer.' }
if ([string]::IsNullOrWhiteSpace($Source) -and $Action -ne 'actualiser') {
    # Sans -Source : la recette reprend la source du dernier « up » (le worktree de la PR en cours) ;
    # à défaut, le worktree qui suit main (avereo-vision-recette).
    $memorise = (Read-RevueEnv (Join-Path $Environnements 'recette\.env'))['VISION_REVUE_SOURCE']
    if ($memorise) { $Source = ($memorise.Replace('/', '\') -replace '\\architecture-v1\\avereo-app-vision$', '') }
}
$RepoRoot = [IO.Path]::GetFullPath((Invoke-RevueGit $LocalDir @('rev-parse', '--show-toplevel')).Trim())
$RepoCommon = (Invoke-RevueGit $RepoRoot @('rev-parse', '--git-common-dir')).Trim()
if (-not [IO.Path]::IsPathRooted($RepoCommon)) { $RepoCommon = Join-Path $RepoRoot $RepoCommon }
$RepoCommon = [IO.Path]::GetFullPath($RepoCommon)
$SourcePrincipale = Join-Path (Split-Path $RepoRoot -Parent) 'avereo-vision-recette'
if ([string]::IsNullOrWhiteSpace($Source) -or $Action -eq 'actualiser') { $Source = $SourcePrincipale }
$Source = [IO.Path]::GetFullPath($Source).TrimEnd('\', '/')
if (-not $PSBoundParameters.ContainsKey('Port')) { $Port = 5250 }
$settings = New-RevueSettings $Nom $Source $Port

if ($Action -eq 'actualiser') {
    Update-RevueRecette $Source
    return
}
Get-Command docker -ErrorAction Stop | Out-Null
& docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker est indisponible. Démarrer Docker Desktop puis réessayer.' }

if ($Action -eq 'etat') {
    foreach ($name in @('recette')) {
        Write-Host "Environnement : $name"
        $envFile = Join-Path (Join-Path $Environnements $name) '.env'
        $values = Read-RevueEnv $envFile
        if (-not $values.ContainsKey('VISION_REVUE_SOURCE')) {
            Write-Host 'Non initialisé : source, conteneurs et santé non disponibles.'
            continue
        }
        $root = Split-Path (Split-Path $values.VISION_REVUE_SOURCE -Parent) -Parent
        $state = New-RevueSettings $name $root ([int]$values.VISION_REVUE_PORT)
        Invoke-RevueCompose $state @('ps', '-a')
        Write-Host "Adresse : http://127.0.0.1:$($state.Port)/revue/"
        Show-RevueSource $state
        try {
            $health = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$($state.Port)/api/health.php" -TimeoutSec 2
            Write-Host "Santé HTTP $($health.StatusCode) : $($health.Content)"
        } catch { Write-Host 'Santé : API indisponible.' }
    }
    return
}

switch ($Action) {
    'up' {
        if ($Source -eq $SourcePrincipale -and -not (Test-Path -LiteralPath $Source)) { Update-RevueRecette $Source }
        Assert-RevueWorktree $Source
        $frontend = Join-Path $settings.SourceApp 'frontend'
        if (-not (Test-Path -LiteralPath (Join-Path $frontend 'package.json'))) {
            throw 'La source ne contient pas architecture-v1/avereo-app-vision/frontend/package.json.'
        }
        if (@(Invoke-RevueGit $Source @('status', '--porcelain')).Count -gt 0) {
            Write-Warning 'La source contient des modifications non commitées : elles seront incluses dans cette revue locale.'
        }
        Assert-RevuePort $settings
        Push-Location -LiteralPath $frontend
        try {
            # Réinstaller les dépendances quand le fichier de verrouillage a changé (nouvelle dépendance après un merge),
            # pas seulement quand node_modules manque : l'empreinte du dernier « npm ci » est gardée dans node_modules.
            $empreinte = (Get-FileHash -Algorithm SHA256 -LiteralPath 'package-lock.json').Hash
            $tampon = Join-Path 'node_modules' '.vision-revue-lock'
            $dejaInstalle = (Test-Path -LiteralPath $tampon) -and ((Get-Content -LiteralPath $tampon -Raw).Trim() -eq $empreinte)
            if (-not $dejaInstalle) {
                & npm.cmd ci
                if ($LASTEXITCODE -ne 0) { throw 'npm ci a échoué ; environnement non démarré.' }
                [IO.File]::WriteAllText((Join-Path (Get-Location) $tampon), $empreinte, $Utf8)
            }
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw 'Le build a échoué ; environnement non démarré.' }
        } finally { Pop-Location }
        Initialize-Revue $settings
        Invoke-RevueCompose $settings @('up', '-d', '--build')
        Invoke-RevueCompose $settings @('exec', '-T', 'api', 'php', '/opt/vision/database/migrate.php')
        Invoke-RevueCompose $settings @('exec', '-T', 'api', 'php', '/opt/revue/donnees-demo.php')
        Wait-RevueHealth $settings
        Write-Host "Recette locale : http://127.0.0.1:$Port/revue/"
        Write-Host 'Comptes fictifs : Conseiller A (900001), Conseiller B (900002), Fondateur F (900009).'
        Show-RevueSource $settings
    }
    'down' { Invoke-RevueCompose $settings @('down') }
    'donnees' {
        # Sans -Confirmer : complète seulement ce qui manque. Avec -Confirmer : rétablit les relevés de démonstration d'origine.
        $arguments = @('exec', '-T', 'api', 'php', '/opt/revue/donnees-demo.php')
        if ($Confirmer) { $arguments += '--retablir' }
        Invoke-RevueCompose $settings $arguments
    }
    'logs' { Invoke-RevueCompose $settings @('logs', '--tail', '100') }
    'reset' {
        # Vérifier les chemins absolus et refuser les jonctions avant toute suppression récursive.
        $allowedRoot = [IO.Path]::GetFullPath($Environnements).TrimEnd('\', '/')
        $target = [IO.Path]::GetFullPath($settings.Directory).TrimEnd('\', '/')
        $expected = [IO.Path]::Combine($allowedRoot, $Nom)
        if ($target -ne $expected -or -not $target.StartsWith($allowedRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Suppression refusée : dossier hors du périmètre de cet environnement.'
        }
        foreach ($path in @($allowedRoot, $target)) {
            if ((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                throw 'Suppression refusée : le dossier est un lien ou une jonction.'
            }
        }
        if (Test-Path -LiteralPath $settings.EnvFile) { Invoke-RevueCompose $settings @('down', '-v') }
        if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
        Write-Host "Environnement $Nom réinitialisé : sa base, ses nonces et sa configuration locale ont été supprimés."
    }
}
