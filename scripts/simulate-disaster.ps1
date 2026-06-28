# ShadowNet Disaster Simulation Script
# Simulates multiple emergency incidents for demo purposes

$API_BASE = "http://localhost:8000/api"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ShadowNet Disaster Simulator         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$incidents = @(
    @{title="Transformer Explosion - Main Substation"; description="Massive explosion at city main substation. Multiple injuries reported. Fire spreading to nearby buildings."; location="120 Main Street, Sector 12"; category="fire"},
    @{title="Building Collapse - Downtown"; description="5-story residential building collapsed. Possible gas leak. Multiple people trapped under debris."; location="45 Park Avenue, Downtown"; category="earthquake"},
    @{title="Chemical Spill - Industrial Zone"; description="Toxic chemical spill from manufacturing plant. Evacuation required within 1km radius."; location="78 Industrial Road, Zone B"; category="hazard"},
    @{title="Flash Flood - Riverside Colony"; description="Rapid flooding in low-lying residential area. Families trapped on rooftops. Rescue boats needed."; location="Riverside Colony, Sector 7"; category="flood"},
    @{title="Multi-Vehicle Collision - Highway"; description="20-vehicle pileup on highway due to heavy fog. Multiple critical injuries. Air ambulance required."; location="Highway 95, Mile Marker 42"; category="medical"},
    @{title="Fire at Chemical Plant"; description="Major fire at chemical processing plant. Risk of explosion. HAZMAT team required."; location="45 Industrial Zone, Sector 5"; category="fire"},
    @{title="Earthquake Aftershock - Residential Zone"; description="Strong aftershock causing further damage to already weakened structures. Gas leaks reported."; location="Green Valley Residency"; category="earthquake"},
    @{title="Water Main Burst - Commercial District"; description="Major water main burst flooding underground parking and ground floors. Electrical hazards present."; location="Financial District, Block C"; category="infrastructure"}
)

foreach ($incident in $incidents) {
    Write-Host "▶ Creating incident: $($incident.title)" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/incidents" -Method Post -Form @{
            title = $incident.title
            description = $incident.description
            location = $incident.location
            category = $incident.category
        }
        Write-Host "  ✓ Created: $($response.id)" -ForegroundColor Green

        # Run AI triage
        Write-Host "  ⟳ Running AI triage..." -ForegroundColor Yellow
        $triage = Invoke-RestMethod -Uri "$API_BASE/triage/$($response.id)" -Method Post
        Write-Host "  ✓ Severity: $($triage.severity) | Dept: $($triage.department)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed: $_" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "✓ Simulation complete!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:8000" -ForegroundColor Cyan
