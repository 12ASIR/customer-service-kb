Set-Location -Path "$PSScriptRoot\app_722906138626"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  $nodePath = "C:\Program Files\nodejs"
  if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
    Write-Host "已自动添加 Node.js 路径到环境变量" -ForegroundColor Gray
  }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "未检测到 npm，请先安装 Node.js (包含 npm) 后再运行此脚本。" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "首次运行：正在安装依赖，请稍候..." -ForegroundColor Yellow
  npm install
}

Write-Host "启动开发服务器：http://localhost:5173/#/query" -ForegroundColor Green
npm run dev

