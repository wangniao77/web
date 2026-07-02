$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Port = 5173
$LogFile = Join-Path $ProjectRoot 'scripts\launch.log'

function Write-Log([string]$Message) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Get-ActiveUrl {
    param([int]$StartPort = 5173, [int]$TryCount = 5)
    for ($p = $StartPort; $p -lt ($StartPort + $TryCount); $p++) {
        $url = "http://127.0.0.1:$p/"
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return $url }
        } catch {}
    }
    return $null
}

function Test-PortListening([int]$CheckPort) {
    return [bool](Get-NetTCPConnection -LocalPort $CheckPort -State Listen -ErrorAction SilentlyContinue)
}

Write-Log 'Launch requested'

if (-not (Test-Path (Join-Path $ProjectRoot 'package.json'))) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "找不到项目目录：$ProjectRoot",
        '大数据与人工智能学院治理驾驶舱',
        'OK',
        'Error'
    ) | Out-Null
    exit 1
}

Set-Location $ProjectRoot

if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Log 'Running npm install'
    & npm.cmd install
}

$activeUrl = Get-ActiveUrl

if (-not $activeUrl) {
    if (-not (Test-PortListening -CheckPort $Port)) {
        Write-Log 'Starting dev server'
        $npmCmd = 'npm.cmd'
        $npmFound = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($npmFound) { $npmCmd = $npmFound.Source }
        Start-Process -FilePath $npmCmd -ArgumentList 'run', 'dev' -WorkingDirectory $ProjectRoot -WindowStyle Normal | Out-Null
    }

    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 800
        $activeUrl = Get-ActiveUrl
        if ($activeUrl) {
            Write-Log "Server ready at $activeUrl"
            break
        }
    }
}

if (-not $activeUrl) {
    Write-Log 'Server failed to start'
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "驾驶舱服务未能启动。`n`n请手动执行：`n1. cd `"$ProjectRoot`"`n2. npm install`n3. npm run dev`n`n然后打开 http://localhost:5173/`n`n日志：$LogFile",
        '大数据与人工智能学院治理驾驶舱',
        'OK',
        'Error'
    ) | Out-Null
    exit 1
}

Write-Log "Opening browser: $activeUrl"
Start-Process $activeUrl
