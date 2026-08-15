$root = $PSScriptRoot
$port = 5173
$pidFile = Join-Path $root ".server.pid"
$serveScript = Join-Path $root "serve.ps1"

function Test-ServerUp {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

if (Test-ServerUp) {
  Write-Host "Server already running on http://127.0.0.1:$port/"
  exit 0
}

if (Test-Path $pidFile) {
  $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
  if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$process = Start-Process powershell.exe -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$serveScript`""
) -WorkingDirectory $root -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 2

if (Test-ServerUp) {
  Write-Host "Server started on http://127.0.0.1:$port/ (PID $($process.Id))"
  exit 0
}

Write-Host "Server failed to start. Check .server.log in the project folder."
exit 1
