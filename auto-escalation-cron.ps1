# Auto-Escalation Cron Job (PowerShell)
# This script checks for expired dealer requests every hour
# Run this in a separate PowerShell terminal or set up as a Windows Task

Write-Host "🤖 Auto-Escalation Monitor Started" -ForegroundColor Green
Write-Host "📅 Checking every hour for expired dealer requests" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Checking for expired requests..." -ForegroundColor White
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auto-escalate-orders" -Method Get
        
        if ($response.success -eq $true) {
            $processed = $response.processed
            $toDealer = $response.escalated_to_dealers
            $toAdmin = $response.escalated_to_admin
            
            Write-Host "  ✅ Processed $processed expired requests" -ForegroundColor Green
            
            if ($toDealer -gt 0) {
                Write-Host "     → $toDealer escalated to next dealer" -ForegroundColor Cyan
            }
            
            if ($toAdmin -gt 0) {
                Write-Host "     → $toAdmin escalated to admin" -ForegroundColor Yellow
            }
            
            if ($processed -eq 0) {
                Write-Host "     ℹ No expired requests found" -ForegroundColor Gray
            }
        }
        else {
            $errorMsg = $response.error
            Write-Host "  ❌ Error: $errorMsg" -ForegroundColor Red
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ❌ Failed to connect: $errorMsg" -ForegroundColor Red
    }
    
    # Wait for 1 hour (3600 seconds)
    Write-Host "  ⏰ Next check in 1 hour`n" -ForegroundColor Gray
    Start-Sleep -Seconds 3600
}
