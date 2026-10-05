$ErrorActionPreference = "Stop"

$ports = @(5000, 5173)
$connections = Get-NetTCPConnection -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort -and $_.State -eq "Listen" }

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

if (-not $processIds) {
  Write-Host "No dev servers are listening on ports 5000 or 5173."
  exit 0
}

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  Write-Host "Stopping $($process.ProcessName) process $processId on SmartStock dev port."
  Stop-Process -Id $processId -Force
}
