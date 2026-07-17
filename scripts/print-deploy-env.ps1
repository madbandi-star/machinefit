param(
  [string]$RenderApiUrl = 'https://machinefit-api.onrender.com/api/v1'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendEnv = Join-Path $root 'backend\.env'

if (-not (Test-Path $backendEnv)) {
  Write-Host 'backend/.env not found. Run setup-backend-env.ps1 first.'
  exit 1
}

function Get-EnvValue {
  param([string]$Key)
  foreach ($line in Get-Content $backendEnv) {
    if ($line -match "^\s*$Key=(.*)$") {
      return $Matches[1]
    }
  }
  return $null
}

$databaseUrl = Get-EnvValue 'DATABASE_URL'
$jwtSecret = Get-EnvValue 'JWT_SECRET'
$jwtRefresh = Get-EnvValue 'JWT_REFRESH_SECRET'

Write-Host ''
Write-Host '=== Render -> machinefit-api -> Environment ===' -ForegroundColor Cyan
Write-Host ''
Write-Host "DATABASE_URL=$databaseUrl"
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "JWT_REFRESH_SECRET=$jwtRefresh"
Write-Host 'CORS_ORIGIN=https://madbandi-star.github.io'
Write-Host ''
Write-Host '=== GitHub -> Settings -> Secrets -> Actions ===' -ForegroundColor Cyan
Write-Host ''
Write-Host "VITE_API_BASE_URL=$RenderApiUrl"
Write-Host 'RENDER_DEPLOY_HOOK_URL=(Render -> machinefit-api -> Settings -> Deploy Hook URL)'
Write-Host ''
Write-Host 'After adding RENDER_DEPLOY_HOOK_URL, push backend changes to main or run Actions -> Deploy Backend to Render.' -ForegroundColor Yellow
