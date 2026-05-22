param(
  [string]$To = $env:TELECOM_TEST_TO,
  [string]$Providers = "twilio,africas-talking,infobip"
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ReportRoot = Join-Path $Root "reports\telecom"
$Stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
$EvidenceDir = Join-Path $ReportRoot "live-telecom-proof-$Stamp"

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

function Add-CommandRecord {
  param([string]$Name, [string]$Status, [string]$ErrorMessage = "")
  Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
    name = $Name
    status = $Status
    error = $ErrorMessage
    at = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Compress)
}

function Require-Env {
  param([string]$Name)
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($Name))) {
    Add-CommandRecord -Name "env:$Name" -Status "blocked" -ErrorMessage "$Name is not configured."
    return $false
  }
  Add-CommandRecord -Name "env:$Name" -Status "present"
  return $true
}

$Required = @(
  "TELECOM_TEST_TO",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "AFRICAS_TALKING_USERNAME",
  "AFRICAS_TALKING_API_KEY",
  "INFOBIP_API_KEY",
  "INFOBIP_BASE_URL",
  "TELECOM_WEBHOOK_SECRET"
)

$Ready = $true
foreach ($Name in $Required) {
  if (-not (Require-Env $Name)) {
    $Ready = $false
  }
}

if (-not $Ready) {
  Set-Content -Path (Join-Path $ReportRoot "latest-live-telecom-proof-dir.txt") -Value $EvidenceDir
  throw "Live telecom proof blocked. Configure required provider credentials and TELECOM_TEST_TO."
}

Push-Location $Root
try {
  $Out = Join-Path $EvidenceDir "live-provider-validation.out.txt"
  $Err = Join-Path $EvidenceDir "live-provider-validation.err.txt"
  npm run telecom:validate-live -- --to=$To --providers=$Providers > $Out 2> $Err
  Add-CommandRecord -Name "telecom:validate-live" -Status "passed"

  npm test -- --test-name-pattern=telecom > (Join-Path $EvidenceDir "telecom-tests.out.txt") 2> (Join-Path $EvidenceDir "telecom-tests.err.txt")
  Add-CommandRecord -Name "telecom-reconciliation-tests" -Status "passed"
} catch {
  Add-CommandRecord -Name "live-telecom-proof" -Status "failed" -ErrorMessage $_.Exception.Message
  throw
} finally {
  Pop-Location
}

Set-Content -Path (Join-Path $ReportRoot "latest-live-telecom-proof-dir.txt") -Value $EvidenceDir
Write-Output "Live telecom proof evidence: $EvidenceDir"
