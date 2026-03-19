# ========================================
# AUTOMATIC STOCK ALERT SCHEDULER
# Schedules the automatic stock alert cron job to run periodically
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTOMATIC STOCK ALERT SCHEDULER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$scriptPath = Join-Path $PSScriptRoot "auto-stock-alert-cron.js"
$logPath = Join-Path $PSScriptRoot "logs"
$logFile = Join-Path $logPath "auto-stock-alert.log"

# Create logs directory if it doesn't exist
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath | Out-Null
    Write-Host "✓ Created logs directory" -ForegroundColor Green
}

# Verify script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "✗ Cron script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Script location: $scriptPath" -ForegroundColor Gray
Write-Host "Log file: $logFile`n" -ForegroundColor Gray

# Schedule options
Write-Host "Select scheduling option:" -ForegroundColor Yellow
Write-Host "1. Every 6 hours (Recommended)" -ForegroundColor White
Write-Host "2. Every 12 hours" -ForegroundColor White
Write-Host "3. Once daily (at 9:00 AM)" -ForegroundColor White
Write-Host "4. Twice daily (9:00 AM and 6:00 PM)" -ForegroundColor White
Write-Host "5. Custom interval" -ForegroundColor White
Write-Host "6. Run once now (test)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`nCreating Windows Scheduled Task: Every 6 hours" -ForegroundColor Yellow
        $taskName = "CCTVAutoStockAlert_6Hours"
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)
    }
    "2" {
        Write-Host "`nCreating Windows Scheduled Task: Every 12 hours" -ForegroundColor Yellow
        $taskName = "CCTVAutoStockAlert_12Hours"
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 12) -RepetitionDuration ([TimeSpan]::MaxValue)
    }
    "3" {
        Write-Host "`nCreating Windows Scheduled Task: Daily at 9:00 AM" -ForegroundColor Yellow
        $taskName = "CCTVAutoStockAlert_Daily"
        $trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
    }
    "4" {
        Write-Host "`nCreating Windows Scheduled Task: Twice daily (9 AM & 6 PM)" -ForegroundColor Yellow
        $taskName = "CCTVAutoStockAlert_TwiceDaily"
        $trigger = @(
            (New-ScheduledTaskTrigger -Daily -At 9:00AM),
            (New-ScheduledTaskTrigger -Daily -At 6:00PM)
        )
    }
    "5" {
        Write-Host "`nCustom interval:" -ForegroundColor Yellow
        $hours = Read-Host "Enter hours between each run"
        $taskName = "CCTVAutoStockAlert_Custom"
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours $hours) -RepetitionDuration ([TimeSpan]::MaxValue)
    }
    "6" {
        Write-Host "`nRunning cron job once (test mode)..." -ForegroundColor Yellow
        node $scriptPath
        Write-Host "`nTest run completed. Check the output above." -ForegroundColor Green
        Write-Host "If successful, run this script again to schedule automatic execution." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "✗ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Create the scheduled task
try {
    # Check if task already exists
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Write-Host "`nTask '$taskName' already exists." -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to overwrite it? (Y/N)"
        
        if ($overwrite -eq 'Y' -or $overwrite -eq 'y') {
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
            Write-Host "✓ Existing task removed" -ForegroundColor Green
        } else {
            Write-Host "Operation cancelled" -ForegroundColor Yellow
            exit 0
        }
    }

    # Define the action
    $action = New-ScheduledTaskAction -Execute "node" -Argument "`"$scriptPath`" >> `"$logFile`" 2>&1" -WorkingDirectory $PSScriptRoot

    # Define settings
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)

    # Register the task
    Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -Description "Automatically sends stock alerts to dealers who haven't updated inventory" -User $env:USERNAME

    Write-Host "`n✓ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "`nTask Name: $taskName" -ForegroundColor White
    Write-Host "Next Run: " -NoNewline -ForegroundColor White
    
    $task = Get-ScheduledTask -TaskName $taskName
    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
    Write-Host $taskInfo.NextRunTime -ForegroundColor Cyan

} catch {
    Write-Host "`n✗ Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host "`nTrying alternative method..." -ForegroundColor Yellow
    
    # Fallback: Create a simple PowerShell loop script
    $loopScript = @"
# Auto Stock Alert Loop Script
# This runs continuously and executes the cron job at specified intervals

cd "$PSScriptRoot"

while (`$true) {
    Write-Host "`n[`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Running auto stock alert cron..." -ForegroundColor Cyan
    node "$scriptPath" >> "$logFile" 2>&1
    
    Write-Host "Next run in 6 hours..." -ForegroundColor Gray
    Start-Sleep -Seconds 21600  # 6 hours
}
"@

    $loopScriptPath = Join-Path $PSScriptRoot "auto-stock-alert-loop.ps1"
    $loopScript | Out-File -FilePath $loopScriptPath -Encoding UTF8
    
    Write-Host "✓ Created loop script: $loopScriptPath" -ForegroundColor Green
    Write-Host "`nTo start the scheduler, run:" -ForegroundColor Yellow
    Write-Host "   .\auto-stock-alert-loop.ps1" -ForegroundColor White
    Write-Host "`nKeep the PowerShell window open to maintain the schedule." -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SCHEDULER SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Management Commands:" -ForegroundColor Yellow
Write-Host "• View scheduled task:" -ForegroundColor White
Write-Host "  Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "`n• Check task history:" -ForegroundColor White
Write-Host "  Get-ScheduledTaskInfo -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "`n• View logs:" -ForegroundColor White
Write-Host "  Get-Content '$logFile' -Tail 50" -ForegroundColor Gray
Write-Host "`n• Disable task:" -ForegroundColor White
Write-Host "  Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "`n• Remove task:" -ForegroundColor White
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""
