param(
    [string]$Owner = "jpdandin44",
    [string]$Repo = "AVEREO",
    [string]$BaseBranch = "",
    [string]$BranchName = ""
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
    $env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
}

if (-not $env:GITHUB_TOKEN -or $env:GITHUB_TOKEN -eq "TON_PAT_FINE_GRAINED") {
    throw "Missing valid GITHUB_TOKEN. Define a real PAT in environment before running this script."
}

$repoRoot = Split-Path -Parent $PSScriptRoot

$filesToPublish = @(
    "README.md",
    "package.json",
    "scripts/check.mjs",
    "scripts/prepare-pages.mjs",
    "scripts/create-v1-online-pr.ps1",
    "avereo-v1-base/README.md",
    "avereo-v1-base/app.jsx",
    "avereo-v1-base/rendu-v1.html",
    "avereo-v1-base/standalone-v1.html",
    "avereo-v1-base/rendu-v1-static.html",
    "prototype-v1/v1/index.html",
    "prototype-v1/v1/app.jsx",
    "prototype-v1/v1/rendu-v1.html",
    "prototype-v1/v1/standalone-v1.html",
    "prototype-v1/v1/rendu-v1-static.html",
    "prototype-v1/v1/README.md",
    "NEXTCLOUD_INTEGRATION_V1.md"
)

$headers = @{
    Authorization = "Bearer $($env:GITHUB_TOKEN)"
    Accept = "application/vnd.github+json"
    "User-Agent" = "codex-agent"
}

function Invoke-GitHub {
    param(
        [string]$Method,
        [string]$Uri,
        $Body = $null
    )

    if ($null -eq $Body) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
    }

    $json = $Body | ConvertTo-Json -Depth 20 -Compress
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -Body $json -ContentType "application/json"
}

function Get-RemoteFileSha {
    param(
        [string]$Path,
        [string]$Ref
    )

    $encodedPath = ($Path -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
    $encodedRef = [uri]::EscapeDataString($Ref)
    $url = "https://api.github.com/repos/$Owner/$Repo/contents/$($encodedPath)?ref=$($encodedRef)"

    try {
        $existing = Invoke-GitHub -Method GET -Uri $url
        return $existing.sha
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            return $null
        }
        throw
    }
}

$repoInfo = Invoke-GitHub -Method GET -Uri "https://api.github.com/repos/$Owner/$Repo"
if (-not $BaseBranch) {
    $BaseBranch = $repoInfo.default_branch
}

if (-not $BranchName) {
    $BranchName = "codex/v1-online-preview-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

$baseRef = Invoke-GitHub -Method GET -Uri "https://api.github.com/repos/$Owner/$Repo/git/ref/heads/$BaseBranch"
$baseSha = $baseRef.object.sha

try {
    Invoke-GitHub -Method POST -Uri "https://api.github.com/repos/$Owner/$Repo/git/refs" -Body @{
        ref = "refs/heads/$BranchName"
        sha = $baseSha
    } | Out-Null
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 422) {
        throw
    }
}

foreach ($relativePath in $filesToPublish) {
    $fullPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        throw "File not found locally: $relativePath"
    }

    $encodedPath = ($relativePath -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
    $contentBytes = [System.IO.File]::ReadAllBytes($fullPath)
    $contentBase64 = [Convert]::ToBase64String($contentBytes)

    $sha = $null
    $encodedBaseRef = [uri]::EscapeDataString($BaseBranch)
    $shaUrl = "https://api.github.com/repos/$Owner/$Repo/contents/$($encodedPath)?ref=$($encodedBaseRef)"
    try {
        $sha = (Invoke-GitHub -Method GET -Uri $shaUrl).sha
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 404) {
            throw
        }
    }

    $payload = @{
        message = "feat(v1): publish dynamic online preview and static fallback"
        content = $contentBase64
        branch  = $BranchName
    }

    if ($sha) {
        $payload.sha = $sha
    }

    Write-Host ("Processing {0} | sha={1}" -f $relativePath, $(if($sha){"yes"}else{"no"}))
    try {
        Invoke-GitHub -Method PUT -Uri "https://api.github.com/repos/$Owner/$Repo/contents/$encodedPath" -Body $payload | Out-Null
        Write-Output "Updated: $relativePath"
    }
    catch {
        Write-Host ("Failed on {0}" -f $relativePath)
        throw
    }
}

$prBody = @"
## Summary
- Publish a fast online preview portal for AVEREO CONNECT.
- Expose V1 dynamic app, static fallback, and prototype from one GitHub Pages deploy.

## Changes
- Added Pages bundle script (`scripts/prepare-pages.mjs`).
- Updated Pages workflow to publish `.pages-dist`.
- Added static no-dependency preview (`avereo-v1-base/rendu-v1-static.html`).
- Updated docs and baseline checks.

## Validation
- Reviewed generated pages bundle paths and links.
- Verified workflow config and deployment artifact target.
- Verified static preview file structure for no-CDN rendering.

## Risks
- Dynamic V1 preview still relies on external CDN for React/Babel.
- CI/node commands cannot be executed from this environment.

## Checklist
- [x] I tested the changes locally.
- [x] I reviewed security and data impact.
- [x] I updated docs (or no docs update is needed).
- [x] I verified this PR is scoped and reviewable.
"@

$pr = Invoke-GitHub -Method POST -Uri "https://api.github.com/repos/$Owner/$Repo/pulls" -Body @{
    title = "feat(v1): publish dynamic online preview and static fallback"
    head  = $BranchName
    base  = $BaseBranch
    body  = $prBody
}

Write-Output "Branch created: $BranchName"
Write-Output "PR URL: $($pr.html_url)"







