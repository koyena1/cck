# Auto-Escalation Cron Job Setup Script
# Run this script every hour to automatically escalate expired order requests

$scriptPath = "D:\cctv-website\auto-escalation-cron-proximity.js"

Write-Host "🤖 Starting Auto-Escalation Cron Job..." -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Run the Node.js script
node $scriptPath

Write-Host ""
Write-Host "✅ Cron job execution completed" -ForegroundColor Green
