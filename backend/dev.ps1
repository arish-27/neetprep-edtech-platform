param(
  [int]$Port = 8001,
  [string]$Host = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$venvScripts = Join-Path $here "venv\\Scripts"
$python = Join-Path $venvScripts "python.exe"
$alembic = Join-Path $venvScripts "alembic.exe"
$uvicorn = Join-Path $venvScripts "uvicorn.exe"

if (Test-Path $python) {
  Write-Host "Using venv Python: $python"
} else {
  $python = "python"
  Write-Host "Using system Python: $python"
}

Write-Host "Applying migrations..."
if (Test-Path $alembic) {
  & $alembic upgrade head
} else {
  & $python -m alembic upgrade head
}

Write-Host "Starting API on http://$Host`:$Port ..."
if (Test-Path $uvicorn) {
  & $uvicorn app.main:app --reload --host $Host --port $Port
} else {
  & $python -m uvicorn app.main:app --reload --host $Host --port $Port
}
