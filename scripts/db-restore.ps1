# AI R&D Platform - Database Restore
# Restores the database from the portable SQL backup file.
# Run this on a new laptop after installing PostgreSQL.

$ErrorActionPreference = "Stop"

$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1).FullName + "\bin"

if (-not (Test-Path "$pgBin\psql.exe")) {
    Write-Host "ERROR: psql.exe not found. Is PostgreSQL installed?" -ForegroundColor Red
    exit 1
}

$backupFile = Join-Path $PSScriptRoot "db-backup.sql"
if (-not (Test-Path $backupFile)) {
    Write-Host "ERROR: db-backup.sql not found. Run db-backup.ps1 first." -ForegroundColor Red
    exit 1
}

# Read port from .env
$envFile = Join-Path $PSScriptRoot "..\web\.env"
$port = "5432"
if (Test-Path $envFile) {
    $match = Select-String -Path $envFile -Pattern 'localhost:(\d+)' | Select-Object -First 1
    if ($match) { $port = $match.Matches[0].Groups[1].Value }
}

# Read password from .env
$password = "postgres"
if (Test-Path $envFile) {
    $pwMatch = Select-String -Path $envFile -Pattern '://postgres:([^@]+)@' | Select-Object -First 1
    if ($pwMatch) { $password = $pwMatch.Matches[0].Groups[1].Value }
}

$env:PGPASSWORD = $password

# Create database if it doesn't exist
Write-Host "Ensuring database ai_rd_platform exists (port $port)..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -p $port -tc "SELECT 1 FROM pg_database WHERE datname = 'ai_rd_platform'" | Out-Null
if ($LASTEXITCODE -ne 0 -or -not ($?)) {
    & "$pgBin\createdb.exe" -U postgres -p $port ai_rd_platform 2>$null
}

Write-Host "Restoring from db-backup.sql..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -p $port -d ai_rd_platform -f $backupFile -q 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Restore failed." -ForegroundColor Red
    exit 1
}
