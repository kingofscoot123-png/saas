$port = 5173
$root = (Resolve-Path $PSScriptRoot).Path
$pidFile = Join-Path $root ".server.pid"
$logFile = Join-Path $root ".server.log"

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Host $line
}

Set-Location $root
Set-Content -Path $pidFile -Value $PID -Encoding ASCII

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")

try {
  $listener.Start()
}
catch {
  Write-Log "Failed to start on port ${port}: $($_.Exception.Message)"
  exit 1
}

Write-Log "CALLBOT local server started (PID $PID)"
Write-Log "Serving: $root"
Write-Log "Open: http://127.0.0.1:$port/"

$mimes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".json" = "application/json; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
}

function Send-File {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [string]$FilePath
  )

  $ext = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
  $contentType = $mimes[$ext]
  if (-not $contentType) { $contentType = "application/octet-stream" }

  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  $Response.ContentType = $contentType
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }

      $fullPath = Join-Path $root $path
      $fullPath = [System.IO.Path]::GetFullPath($fullPath)

      if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $response.StatusCode = 403
      }
      elseif (Test-Path $fullPath -PathType Container) {
        $indexPath = Join-Path $fullPath "index.html"
        if (Test-Path $indexPath) {
          Send-File -Response $response -FilePath $indexPath
        } else {
          $response.StatusCode = 404
        }
      }
      elseif (Test-Path $fullPath -PathType Leaf) {
        Send-File -Response $response -FilePath $fullPath
      }
      else {
        $response.StatusCode = 404
      }
    }
    catch {
      $response.StatusCode = 500
      Write-Log "Request error: $($_.Exception.Message)"
    }
    finally {
      $response.Close()
    }
  }
}
catch {
  Write-Log "Server stopped: $($_.Exception.Message)"
}
finally {
  if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
  $listener.Stop()
  $listener.Close()
  Write-Log "Server closed"
}
