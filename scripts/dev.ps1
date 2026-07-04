<#
.SYNOPSIS
    Launches Mjolnir in full development mode (Rust check + Vite dev server + Electron).
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

function Invoke-Pnpm {
    param([Parameter(ValueFromRemainingArguments=$true)]$PnpmArgs)
    if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
        & pnpm @PnpmArgs
    } else {
        & npx -y pnpm@latest @PnpmArgs
    }
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1 -and $LASTEXITCODE -ne 4294967295) {
        throw "pnpm command failed with exit code $LASTEXITCODE."
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " * MJOLNIR - Starting Full Development Workspace" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location $RootDir

if (-not (Test-Path (Join-Path $RootDir "node_modules"))) {
    Write-Host "[0/2] Installing workspace dependencies (pnpm install)..." -ForegroundColor Yellow
    Invoke-Pnpm install
}

Write-Host "[1/2] Building shared TypeScript types..." -ForegroundColor Yellow
Invoke-Pnpm --filter @mjolnir/shared-types build

Write-Host "[2/2] Launching Electron + React Vite Dev Server..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -and $_.OwningProcess -ne 0 -and $_.OwningProcess -ne $PID) {
        Write-Host "Port 5173 is in use by PID $($_.OwningProcess). Terminating old server..." -ForegroundColor Yellow
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Invoke-Pnpm --filter @mjolnir/desktop run dev
