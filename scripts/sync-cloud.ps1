# ShadowNet Cloud Sync Script
# Triggers cloud synchronization for all queued offline data

$API_BASE = "http://localhost:8000/api"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      ShadowNet Cloud Sync Engine          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're online
$online = Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet
if (-not $online) {
    Write-Host "⚠ No internet connection. Data will remain queued." -ForegroundColor Yellow
    Write-Host "  → Items stored locally in SQLite" -ForegroundColor Gray
    exit 1
}

Write-Host "[1/3] Checking sync queue..." -ForegroundColor Yellow
try {
    $queue = Invoke-RestMethod -Uri "$API_BASE/sync" -Method Get
    $pending = ($queue | Where-Object { $_.status -eq "pending" }).Count
    Write-Host "  → $pending items pending sync" -ForegroundColor Cyan

    if ($pending -eq 0) {
        Write-Host "  ✓ All data already synchronized!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "✗ Failed to connect to API: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Triggering cloud sync..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$API_BASE/sync" -Method Post
    Write-Host "  ✓ Synced $($result.synced) items" -ForegroundColor Green
} catch {
    Write-Host "✗ Sync failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Verifying sync status..." -ForegroundColor Yellow
try {
    $queue = Invoke-RestMethod -Uri "$API_BASE/sync" -Method Get
    $remaining = ($queue | Where-Object { $_.status -eq "pending" }).Count
    if ($remaining -eq 0) {
        Write-Host "  ✓ All items synchronized successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $remaining items remaining (will retry)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✓ Sync complete!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:8000" -ForegroundColor Cyan
