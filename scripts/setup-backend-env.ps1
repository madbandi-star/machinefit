param(
  [Parameter(Mandatory = $true)]
  [string]$DbPassword,

  [string]$ProjectRef = 'igthtqiatrglhvysksbj',
  [string]$PoolerHost = 'aws-1-ap-northeast-2.pooler.supabase.com',
  [int]$PoolerPort = 5432
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendEnv = Join-Path $root 'backend\.env'
$frontendEnv = Join-Path $root 'frontend\.env'

# URL-encode password if it contains special characters
Add-Type -AssemblyName System.Web
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($DbPassword)

$databaseUrl = "postgresql://postgres.$ProjectRef`:$encodedPassword@$PoolerHost`:$PoolerPort/postgres"

function New-RandomSecret {
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
}

$jwtSecret = New-RandomSecret
$jwtRefresh = New-RandomSecret

$backendContent = @"
NODE_ENV=development
PORT=3001
API_BASE_PATH=/api/v1

DATABASE_URL=$databaseUrl

JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$jwtRefresh
JWT_REFRESH_EXPIRES_IN=7d

SUPABASE_URL=https://$ProjectRef.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CORS_ORIGIN=http://localhost:5173,http://localhost:5174
"@

$frontendContent = @"
VITE_API_BASE_URL=http://localhost:3001/api/v1
"@

Set-Content -Path $backendEnv -Value $backendContent -Encoding UTF8
Set-Content -Path $frontendEnv -Value $frontendContent -Encoding UTF8

Write-Host "Created backend/.env and frontend/.env"
Write-Host ""
Write-Host "=== Render / GitHub Secrets (copy these) ==="
Write-Host "DATABASE_URL=$databaseUrl"
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "JWT_REFRESH_SECRET=$jwtRefresh"
Write-Host "CORS_ORIGIN=https://madbandi-star.github.io"
Write-Host "VITE_API_BASE_URL=https://YOUR-RENDER-APP.onrender.com/api/v1"
