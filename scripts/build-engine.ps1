<#
.SYNOPSIS
    Builds the Mjolnir Rust native core engine and prepares it for Electron desktop usage.
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$EngineDir = Join-Path $RootDir "engine"
$DesktopResourcesDir = Join-Path $RootDir "apps/desktop/resources/engine"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " * MJOLNIR - Building High-Performance Rust Core Engine" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure target resource directory exists
if (-not (Test-Path $DesktopResourcesDir)) {
    New-Item -ItemType Directory -Force -Path $DesktopResourcesDir | Out-Null
}

if ($IsWindows -or $env:OS -like "*Windows*") {
    Write-Host "[1/4] Initializing Visual Studio MSVC Build Environment..." -ForegroundColor Yellow
    
    # Locate actual link.exe to avoid empty VS installations
    $linkSearch = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio" -Filter "link.exe" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*Hostx64\x64\link.exe*" } | Select-Object -First 1
    if ($linkSearch) {
        $linkDir = $linkSearch.DirectoryName
        Write-Host "Found MSVC linker at: $($linkSearch.FullName)" -ForegroundColor Green
        $env:PATH = "$linkDir;$env:PATH"
        
        # Locate corresponding Launch-VsDevShell.ps1
        $curr = $linkSearch.Directory
        while ($curr -and $curr.Name -ne "Microsoft Visual Studio") {
            $devShell = Join-Path $curr.FullName "Common7\Tools\Launch-VsDevShell.ps1"
            if (Test-Path $devShell) {
                Write-Host "Initializing VsDevShell from: $($curr.FullName)" -ForegroundColor Green
                & $devShell -Arch amd64 -SkipAutomaticLocation -ErrorAction SilentlyContinue | Out-Null
                break
            }
            $curr = $curr.Parent
        }
    } else {
        Write-Host "WARNING: MSVC link.exe not found! Please install Visual Studio Build Tools with C++." -ForegroundColor Red
    }

    $kernel32Found = $false
    if ($env:LIB) {
        foreach ($dir in ($env:LIB -split ";")) {
            if ($dir -and (Test-Path (Join-Path $dir "kernel32.lib"))) { $kernel32Found = $true; break }
        }
    }
    if (-not $kernel32Found) {
        $sdkSearch = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Windows Kits" -Filter "kernel32.lib" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($sdkSearch) {
            Write-Host "Found Windows SDK library at: $($sdkSearch.DirectoryName)" -ForegroundColor Green
            $env:LIB = "$($sdkSearch.DirectoryName);$env:LIB"
            $kernel32Found = $true
        }
    }
    if (-not $kernel32Found) {
        Write-Host "==========================================================================" -ForegroundColor Red
        Write-Host "ERROR: Windows C++ SDK (kernel32.lib) is NOT installed on your machine!" -ForegroundColor Red
        Write-Host "Because Visual Studio Build Tools was already installed, winget did not add new components." -ForegroundColor Yellow
        Write-Host "Please run this command in an Administrator PowerShell to install the Windows SDK:" -ForegroundColor Yellow
        Write-Host "  winget install Microsoft.WindowsSDK.10.0.22621 --accept-source-agreements --accept-package-agreements" -ForegroundColor Cyan
        Write-Host "Or open Visual Studio Installer from your Start Menu, click Modify, and check 'Windows 10/11 SDK'." -ForegroundColor Cyan
        Write-Host "==========================================================================" -ForegroundColor Red
    }
}

Write-Host "[2/4] Navigating to Rust engine directory..." -ForegroundColor Yellow
Set-Location $EngineDir

Write-Host "[3/4] Compiling Mjolnir Native Engine (cargo build --release)..." -ForegroundColor Yellow
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        throw "Cargo release build failed with exit code $LASTEXITCODE."
    }
} catch {
    Write-Host "Error during cargo build: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Copying compiled engine binary to Electron desktop resources..." -ForegroundColor Yellow
$BinaryName = if ($IsWindows -or $env:OS -like "*Windows*") { "mjolnir-engine.exe" } else { "mjolnir-engine" }
$SourceBinary = Join-Path $EngineDir "target/release/$BinaryName"
$DestBinary = Join-Path $DesktopResourcesDir $BinaryName

if (Test-Path $SourceBinary) {
    Copy-Item -Path $SourceBinary -Destination $DestBinary -Force
    Write-Host "SUCCESS: Mjolnir Core Engine copied to $DestBinary" -ForegroundColor Green
} else {
    Write-Host "ERROR: Compiled binary not found at $SourceBinary" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " * Rust Engine Build Complete! Ready for Desktop launch." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
