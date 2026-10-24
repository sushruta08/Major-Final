# ============================================================
# SecureCI Demo Projects — GitHub Push Script (SSH)
# Run: .\push_to_github.ps1 -Token "ghp_your_token_here"
# SSH key is already configured for umeshakkati.
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"

$GH_USER   = "umeshakkati"
$BASE_DIR  = $PSScriptRoot
$CURL      = "C:\Windows\System32\curl.exe"

$projects = @(
    @{ name = "healthcare-patient-portal";  description = "Healthcare patient records portal (security demo)" },
    @{ name = "ecommerce-storefront";       description = "E-Commerce storefront and checkout (security demo)" },
    @{ name = "devops-config-toolkit";      description = "DevOps deployment and backup automation (security demo)" },
    @{ name = "internal-hr-dashboard";      description = "Internal HR management dashboard (security demo)" },
    @{ name = "crypto-audit-service";       description = "Cryptographic algorithm audit service (security demo)" }
)

foreach ($proj in $projects) {
    $name = $proj.name
    $desc = $proj.description
    $dir  = Join-Path $BASE_DIR $name

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  Project: $name" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # 1. Create GitHub repo via API
    Write-Host "  [1/3] Creating GitHub repository..." -ForegroundColor Gray
    $body = "{`"name`":`"$name`",`"description`":`"$desc`",`"private`":false,`"auto_init`":false}"
    $response = & $CURL -s -o NUL -w "%{http_code}" `
        -X POST "https://api.github.com/user/repos" `
        -H "Authorization: Bearer $Token" `
        -H "Content-Type: application/json" `
        -H "Accept: application/vnd.github+json" `
        -d $body

    if ($response -eq "201") {
        Write-Host "  [1/3] Repository created." -ForegroundColor Green
    } elseif ($response -eq "422") {
        Write-Host "  [1/3] Repository already exists — continuing." -ForegroundColor Yellow
    } else {
        Write-Host "  [1/3] WARNING: API response $response" -ForegroundColor Red
    }

    # 2. Init local git repo
    Write-Host "  [2/3] Initialising git repo..." -ForegroundColor Gray
    Push-Location $dir

    if (-Not (Test-Path ".git")) {
        git init -b main | Out-Null
        git add . | Out-Null
        git commit -m "feat: initial project setup" | Out-Null
        Write-Host "  [2/3] Committed initial files." -ForegroundColor Green
    } else {
        git add .
        $status = git status --porcelain
        if ($status) {
            git commit -m "feat: update project files" | Out-Null
        }
        Write-Host "  [2/3] Repo already initialised." -ForegroundColor Green
    }

    # 3. Push via SSH (no token needed in remote URL)
    Write-Host "  [3/3] Pushing via SSH..." -ForegroundColor Gray
    git remote remove origin 2>$null
    git remote add origin "git@github.com:${GH_USER}/${name}.git"
    git push -u origin main --force

    Write-Host "  [3/3] Done! https://github.com/$GH_USER/$name" -ForegroundColor Green
    Pop-Location
}

Write-Host "`n✅ All 5 projects pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Repositories:" -ForegroundColor Cyan
foreach ($proj in $projects) {
    Write-Host "  → https://github.com/$GH_USER/$($proj.name)" -ForegroundColor White
}
Write-Host ""
Write-Host "Expected security scores after scanning in SecureCI:" -ForegroundColor Cyan
Write-Host "  healthcare-patient-portal  →  ~22   Grade: F   (critical SQL injection, hardcoded secrets, unsafe deserialization)" -ForegroundColor Red
Write-Host "  ecommerce-storefront       →  ~55   Grade: D   (high/medium: weak crypto, open redirect, missing sig verification)" -ForegroundColor DarkYellow
Write-Host "  devops-config-toolkit      →  ~71   Grade: C   (medium: TLS skip, shell injection in migration, log injection)" -ForegroundColor Yellow
Write-Host "  internal-hr-dashboard      →  ~82   Grade: A   (low: long session TTL, no rate limiting on salary endpoint)" -ForegroundColor Green
Write-Host "  crypto-audit-service       →  ~96   Grade: A+  (info only: cipher name references in audit scanner itself)" -ForegroundColor Green
