param(
  [Parameter(Mandatory=$true)][string]$Repo,
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$DisplayName,
  [Parameter(Mandatory=$true)][ValidateSet("react","legacy","react-ts")][string]$Type
)

$dirs = @(
  "frontend/src/components","frontend/src/pages","frontend/src/hooks","frontend/src/services","frontend/src/utils","frontend/src/config",
  "frontend/public","backend","database/migrations","database/seeds","docs",".github/workflows"
)
foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path (Join-Path $Repo $dir) | Out-Null
}
git -C $Repo init

Write-Host "Application scaffold created."
Write-Host "Next:"
Write-Host "  cd $Repo/frontend"
Write-Host "  npm install"
Write-Host "  npm run build"
Write-Host "No secrets were created. Backend and MySQL stay disabled in V1."
