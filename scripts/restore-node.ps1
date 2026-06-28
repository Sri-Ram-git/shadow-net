# ShadowNet Node Restore Script
# Restores a previously failed node to the cluster

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      ShadowNet Node Restore Utility       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$kubectlAvailable = Get-Command kubectl -ErrorAction SilentlyContinue
if (-not $kubectlAvailable) {
    Write-Host "⚠ kubectl not available. Install K3s first." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Checking cluster status..." -ForegroundColor Yellow
$nodes = kubectl get nodes -o json | ConvertFrom-Json
$notReady = $nodes.items | Where-Object { $_.status.conditions | Where-Object { $_.type -eq "Ready" -and $_.status -ne "True" } }

if ($notReady.Count -eq 0) {
    Write-Host "  ✓ All nodes are healthy. Nothing to restore." -ForegroundColor Green
    exit 0
}

Write-Host "  ⚠ Found $($notReady.Count) unhealthy node(s):" -ForegroundColor Yellow
foreach ($node in $notReady) {
    Write-Host "    - $($node.metadata.name)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/3] Attempting node recovery..." -ForegroundColor Yellow
foreach ($node in $notReady) {
    Write-Host "  → Uncordoning node: $($node.metadata.name)" -ForegroundColor Yellow
    kubectl uncordon $node.metadata.name

    Write-Host "  → Waiting for node to become Ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=Ready node/$($node.metadata.name) --timeout=60s
}

Write-Host ""
Write-Host "[3/3] Verifying pod rescheduling..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$pods = kubectl get pods -n shadownet -o json | ConvertFrom-Json
$running = ($pods.items | Where-Object { $_.status.phase -eq "Running" }).Count
$total = $pods.items.Count
Write-Host "  → Pods running: $running / $total" -ForegroundColor Cyan

Write-Host ""
Write-Host "✓ Node restore complete!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:8000" -ForegroundColor Cyan
