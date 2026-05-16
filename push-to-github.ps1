#!/usr/bin/env pwsh
# Floating AI - GitHub Push Script for PowerShell
# This script initializes git, commits, and pushes to GitHub

param(
    [string]$GitUsername = "",
    [string]$GitEmail = "",
    [string]$RepoUrl = "https://github.com/suraj-mm/IBM-BOB-PROJECT.git"
)

$projectPath = "c:\Users\kowshik kailas\T_three\floating-ai"
$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      Floating AI - GitHub Push Script                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
Write-Host "📋 Checking for Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = & git --version 2>&1
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installing Git..." -ForegroundColor Yellow
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "Run the installer and restart your terminal after installation." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📁 Navigating to project directory..." -ForegroundColor Yellow
cd $projectPath
Write-Host "✓ Working directory: $(Get-Location)" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Configuring Git..." -ForegroundColor Yellow

# Get Git user info if not provided
if (-not $GitUsername) {
    $GitUsername = Read-Host "Enter your GitHub username"
}
if (-not $GitEmail) {
    $GitEmail = Read-Host "Enter your email address"
}

# Initialize git repo
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Gray
    & git init
    Write-Host "✓ Repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Repository already initialized" -ForegroundColor Green
}

# Configure user
Write-Host "Configuring user..." -ForegroundColor Gray
& git config user.name "$GitUsername"
& git config user.email "$GitEmail"
Write-Host "✓ User configured: $GitUsername <$GitEmail>" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Staging files..." -ForegroundColor Yellow
& git add .
$status = & git status --short
if ($status) {
    $fileCount = ($status | Measure-Object -Line).Lines
    Write-Host "✓ Staged $fileCount files" -ForegroundColor Green
} else {
    Write-Host "ℹ No changes to stage" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
$commitMsg = "Initial commit: Floating AI desktop assistant - Production-grade Electron+React overlay with real-time engineering alerts, merge-risk detection, team collaboration tracking, and secure IPC architecture"

try {
    & git commit -m $commitMsg
    Write-Host "✓ Commit created" -ForegroundColor Green
} catch {
    Write-Host "ℹ Nothing to commit or already committed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Adding remote origin..." -ForegroundColor Yellow

# Remove existing remote if it exists
$remoteExists = & git remote | Select-String -Pattern "origin" -Quiet
if ($remoteExists) {
    Write-Host "Removing existing origin..." -ForegroundColor Gray
    & git remote remove origin
}

& git remote add origin $RepoUrl
Write-Host "✓ Remote added: $RepoUrl" -ForegroundColor Green

Write-Host ""
Write-Host "🌿 Setting default branch to main..." -ForegroundColor Yellow
& git branch -M main
Write-Host "✓ Branch set to main" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted to authenticate with GitHub" -ForegroundColor Cyan
Write-Host ""

try {
    & git push -u origin main
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║          ✓ Successfully pushed to GitHub!                  ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your project is now live at:" -ForegroundColor Green
    Write-Host "$RepoUrl" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "⚠️  Push failed. Possible reasons:" -ForegroundColor Red
    Write-Host "  • GitHub authentication failed" -ForegroundColor Yellow
    Write-Host "  • Network connection issue" -ForegroundColor Yellow
    Write-Host "  • Repository doesn't exist" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running: git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "📊 Repository status:" -ForegroundColor Yellow
& git log --oneline -5
Write-Host ""
& git remote -v
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
