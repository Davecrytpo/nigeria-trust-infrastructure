param(
  [string]$VpsHost = $env:NTI_VPS_HOST,
  [string]$VpsUser = $env:NTI_VPS_USER,
  [string]$RemotePath = $env:NTI_VPS_PATH
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ReportRoot = Join-Path $Root "reports\runtime"
$Stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
$EvidenceDir = Join-Path $ReportRoot "vps-distributed-proof-$Stamp"

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

function Add-Record {
  param([string]$Name, [string]$Status, [string]$ErrorMessage = "")
  Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
    name = $Name
    status = $Status
    error = $ErrorMessage
    at = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Compress)
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Add-Record -Name "ssh" -Status "blocked" -ErrorMessage "ssh is not installed or not on PATH."
  Set-Content -Path (Join-Path $ReportRoot "latest-vps-distributed-proof-dir.txt") -Value $EvidenceDir
  throw "VPS proof blocked: ssh is unavailable."
}

if ([string]::IsNullOrWhiteSpace($VpsHost) -or [string]::IsNullOrWhiteSpace($VpsUser) -or [string]::IsNullOrWhiteSpace($RemotePath)) {
  Add-Record -Name "vps-config" -Status "blocked" -ErrorMessage "Set NTI_VPS_HOST, NTI_VPS_USER, and NTI_VPS_PATH."
  Set-Content -Path (Join-Path $ReportRoot "latest-vps-distributed-proof-dir.txt") -Value $EvidenceDir
  throw "VPS proof blocked: missing NTI_VPS_HOST, NTI_VPS_USER, or NTI_VPS_PATH."
}

$Target = "$VpsUser@$VpsHost"
$RemoteCommand = @"
set -eu
cd '$RemotePath'
docker --version
docker compose version
npm --version
npm run prod:env:validate
sh scripts/host/run-vps-runtime-proof.sh
npm run runtime:validate
npm run runtime:failure-drills
docker compose -f compose.production.yaml -f compose.observability.yaml restart redis
sleep 5
npm run recovery:redis
npm run runtime:validate
docker compose -f compose.production.yaml -f compose.observability.yaml ps
"@

try {
  ssh $Target $RemoteCommand > (Join-Path $EvidenceDir "vps-runtime-proof.out.txt") 2> (Join-Path $EvidenceDir "vps-runtime-proof.err.txt")
  Add-Record -Name "vps-runtime-proof" -Status "passed"
} catch {
  Add-Record -Name "vps-runtime-proof" -Status "failed" -ErrorMessage $_.Exception.Message
  throw
}

Set-Content -Path (Join-Path $ReportRoot "latest-vps-distributed-proof-dir.txt") -Value $EvidenceDir
Write-Output "VPS distributed proof evidence: $EvidenceDir"
