param(
  [string]$WorkspaceFolder = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [switch]$SkipDevcontainerCli
)

$ErrorActionPreference = 'Continue'

$logRoot = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$summaryLog = Join-Path $logRoot "summary-$stamp.log"
$dockerRunLog = Join-Path $logRoot "docker-run-$stamp.log"
$devcontainerLog = Join-Path $logRoot "devcontainer-cli-$stamp.log"

function Invoke-Logged {
  param(
    [string]$Title,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$LogPath
  )

  "## $Title" | Tee-Object -FilePath $LogPath -Append
  "Command: $FilePath $($Arguments -join ' ')" | Tee-Object -FilePath $LogPath -Append

  try {
    & $FilePath @Arguments 2>&1 | Tee-Object -FilePath $LogPath -Append
    "ExitCode: $LASTEXITCODE" | Tee-Object -FilePath $LogPath -Append
  } catch {
    "Exception: $($_.Exception.Message)" | Tee-Object -FilePath $LogPath -Append
  }

  "" | Tee-Object -FilePath $LogPath -Append
}

"Workspace: $WorkspaceFolder" | Tee-Object -FilePath $summaryLog
"Timestamp: $stamp" | Tee-Object -FilePath $summaryLog -Append
"" | Tee-Object -FilePath $summaryLog -Append

Invoke-Logged -Title 'Docker Version' -FilePath 'docker' -Arguments @('version') -LogPath $summaryLog
Invoke-Logged -Title 'Docker Info' -FilePath 'docker' -Arguments @('info') -LogPath $summaryLog
Invoke-Logged -Title 'Devcontainer Config' -FilePath 'powershell' -Arguments @(
  '-NoProfile',
  '-Command',
  "Get-Content -Raw '$PSScriptRoot/devcontainer.json'"
) -LogPath $summaryLog

$workspaceMount = "${WorkspaceFolder}:/workspaces/DiffPairUtil"
Invoke-Logged -Title 'Direct Container Install And Test' -FilePath 'docker' -Arguments @(
  'run',
  '--rm',
  '-u',
  'node',
  '-v',
  $workspaceMount,
  '-v',
  'diffpairutil-diagnostic-node_modules:/workspaces/DiffPairUtil/node_modules',
  '-w',
  '/workspaces/DiffPairUtil',
  'mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm',
  'bash',
  '-lc',
  'sudo chown node:node node_modules && npm ci && npm test'
) -LogPath $dockerRunLog

if (-not $SkipDevcontainerCli) {
  Invoke-Logged -Title 'Dev Containers CLI Up' -FilePath 'npx' -Arguments @(
    '--yes',
    '@devcontainers/cli',
    'up',
    '--workspace-folder',
    $WorkspaceFolder,
    '--log-level',
    'trace',
    '--log-format',
    'text'
  ) -LogPath $devcontainerLog
}

"Logs written:" | Tee-Object -FilePath $summaryLog -Append
"$summaryLog" | Tee-Object -FilePath $summaryLog -Append
"$dockerRunLog" | Tee-Object -FilePath $summaryLog -Append
if (-not $SkipDevcontainerCli) {
  "$devcontainerLog" | Tee-Object -FilePath $summaryLog -Append
}

Write-Host "Diagnostic logs written to $logRoot"
