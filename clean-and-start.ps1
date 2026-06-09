# Clean Metro Cache and Start App
# Run: .\clean-and-start.ps1

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Cleaning Metro Cache and Starting App" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

Write-Host "Step 1: Cleaning caches..." -ForegroundColor Yellow
Write-Host ""

# Metro cache in node_modules
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "   ✅ Deleted node_modules\.cache" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules\.cache not found" -ForegroundColor Gray
}

# Temp Metro files
$tempFiles = @("metro-*", "react-*", "haste-*")
foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path $env:TEMP -Filter $pattern -ErrorAction SilentlyContinue
    if ($files) {
        Remove-Item -Path $files.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Deleted temp $pattern" -ForegroundColor Green
    }
}

# Watchman cache
$watchmanCache = Join-Path $env:LOCALAPPDATA "Temp\watchman"
if (Test-Path $watchmanCache) {
    Remove-Item -Recurse -Force $watchmanCache -ErrorAction SilentlyContinue
    Write-Host "   ✅ Deleted watchman cache" -ForegroundColor Green
}

# Android build cache (optional, uncomment if needed)
# if (Test-Path "android\.gradle") {
#     Remove-Item -Recurse -Force "android\.gradle"
#     Write-Host "   ✅ Deleted Android gradle cache" -ForegroundColor Green
# }

Write-Host ""
Write-Host "Step 2: Starting Metro bundler with clean cache..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start Metro with reset cache
npm start -- --reset-cache
