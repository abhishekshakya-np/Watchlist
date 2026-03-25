# Waits for the dev server on 3001, then opens the default browser (used by start-watchlist-windows.bat).
$uri = 'http://127.0.0.1:3001/'
$open = 'http://localhost:3001/'
$maxAttempts = 90
for ($i = 0; $i -lt $maxAttempts; $i++) {
  try {
    $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) {
      Start-Process $open
      exit 0
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}
Write-Host 'Watchlist did not respond in time. Open http://localhost:3001 in your browser when the server is ready.'
