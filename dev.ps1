param(
  [int]$BackendPort = 8001,
  [string]$BackendHost = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$backendScript = Join-Path $backendDir "dev.ps1"

if (-not (Test-Path $backendScript)) {
  throw "Missing backend dev script at: $backendScript"
}

Write-Host "Starting backend in a new terminal..."
Start-Process -FilePath "powershell.exe" -WorkingDirectory $backendDir -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $backendScript,
  "-Port",
  $BackendPort,
  "-Host",
  $BackendHost
)

$healthUrl = "http://$BackendHost`:$BackendPort/health"
Write-Host "Waiting for backend health: $healthUrl"
$deadline = (Get-Date).AddSeconds(25)
$ready = $false
while ((Get-Date) -lt $deadline) {
  try {
    Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Milliseconds 600
  }
}

if (-not $ready) {
  Write-Warning "Backend is not reachable yet. Check the backend terminal for errors."
} else {
  Write-Host "Backend is up."
}

Write-Host "Starting frontend in this terminal..."
Set-Location $frontendDir
$env:VITE_BACKEND_ORIGIN = "http://$BackendHost`:$BackendPort"
npm run dev
