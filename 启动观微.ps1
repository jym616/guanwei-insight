$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath "node_modules")) {
    npm install
}

$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"

Write-Host "Starting Guanwei Insight..."

npx --no-install vinext dev