# Stops any process listening on TCP 3001 (dev server default).
$conns = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if (-not $conns) { exit 0 }
$pids = $conns | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
foreach ($p in $pids) {
  if ($p) {
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $p that was using port 3001."
  }
}
