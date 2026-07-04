<#
.SYNOPSIS
    Packages the complete Mjolnir Desktop Application for distribution using electron-builder.
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
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm command failed with exit code $LASTEXITCODE."
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " * MJOLNIR - Packaging Complete Production Distribution" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location $RootDir

if (-not (Test-Path (Join-Path $RootDir "node_modules"))) {
    Write-Host "[0/3] Installing workspace dependencies (pnpm install)..." -ForegroundColor Yellow
    Invoke-Pnpm install
}

Write-Host "[1/3] Building Rust Mjolnir Engine in Release Mode..." -ForegroundColor Yellow
& (Join-Path $ScriptDir "build-engine.ps1")

Write-Host "[2/3] Building Shared Types & Frontend Bundles..." -ForegroundColor Yellow
Invoke-Pnpm -r run build

Write-Host "[3/3] Running electron-builder (NSIS / Portable / DMG / AppImage)..." -ForegroundColor Yellow
Set-Location (Join-Path $RootDir "apps/desktop")
Invoke-Pnpm exec electron-builder --publish never

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " * Mjolnir Enterprise Packaging Complete!" -ForegroundColor Green
Write-Host " Check apps/desktop/release/ for generated installers." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
