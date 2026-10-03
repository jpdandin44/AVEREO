param(
    [string]$ProfileRoot = [Environment]::GetFolderPath('UserProfile'),
    [switch]$ReplaceExistingLinks
)
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Cet installateur utilise les jonctions Windows. Sur un autre système, créer les liens dans ~/.agents/skills vers les deux dossiers du socle.' }
$protocolSource = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$profileSource = [IO.Path]::GetFullPath($ProfileRoot)
$links = @()
foreach ($surface in @('.agents', '.codex')) {
    foreach ($skillName in @('dev', 'developpement-github-cockpit')) {
        $source = Join-Path $protocolSource "skills/$skillName"
        if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) { throw "Skill absent : $source" }
        $link = Join-Path $profileSource "$surface/skills/$skillName"
        $existing = Get-Item -LiteralPath $link -Force -ErrorAction SilentlyContinue
        $same = $existing -and $existing.LinkType -eq 'Junction' -and [IO.Path]::GetFullPath(@($existing.Target)[0]).TrimEnd('\') -eq $source.TrimEnd('\')
        if ($existing -and -not $same -and (-not $ReplaceExistingLinks -or $existing.LinkType -ne 'Junction')) {
            throw "Installation existante préservée : $link. Seules les jonctions peuvent être remplacées avec -ReplaceExistingLinks."
        }
        $links += [pscustomobject]@{Source=$source; Link=$link; Existing=$existing; Same=$same}
    }
}
foreach ($entry in $links) {
    if ($entry.Same) { continue }
    New-Item -ItemType Directory -Path (Split-Path -Parent $entry.Link) -Force | Out-Null
    # Remove only a verified junction; never recurse into its target.
    if ($entry.Existing) { Remove-Item -LiteralPath $entry.Link -Force }
    New-Item -ItemType Junction -Path $entry.Link -Target $entry.Source | Out-Null
}
$links | Select-Object Link, Source
Write-Output 'Skills installés pour cet utilisateur, utilisables depuis ses différents dépôts. Le protocole et les accords restent ceux du skill de référence.'
