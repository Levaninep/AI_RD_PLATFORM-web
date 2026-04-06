# AI R&D Platform - Database Backup
# Exports the full PostgreSQL database to a portable SQL file in this folder.
# Run this before switching laptops or whenever you want a snapshot.

$ErrorActionPreference = "Stop"

$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1).FullName + "\bin"

if (-not (Test-Path "$pgBin\pg_dump.exe")) {
    Write-Host "ERROR: pg_dump.exe not found. Is PostgreSQL installed?" -ForegroundColor Red
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
$outFile = Join-Path $PSScriptRoot "db-backup.sql"

Write-Host "Backing up database ai_rd_platform (port $port)..." -ForegroundColor Cyan
& "$pgBin\pg_dump.exe" -U postgres -p $port -d ai_rd_platform --clean --if-exists --no-owner --no-privileges -f $outFile

if ($LASTEXITCODE -eq 0) {
    $size = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
    Write-Host "Backup saved to: $outFile ($size KB)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Backup failed." -ForegroundColor Red
    exit 1
}
