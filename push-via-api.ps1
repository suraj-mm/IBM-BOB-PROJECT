#!/usr/bin/env pwsh
# Floating AI - GitHub Push via REST API (No Git Required)

param(
    [string]$GitHubToken = "",
    [string]$RepoUrl = "https://github.com/suraj-mm/IBM-BOB-PROJECT.git"
)

$projectPath = "c:\Users\kowshik kailas\T_three\floating-ai"
$owner = "suraj-mm"
$repo = "IBM-BOB-PROJECT"
$branch = "main"

Write-Host "Floating AI - GitHub Push via REST API" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if (-not $GitHubToken) {
    Write-Host "GitHub Personal Access Token Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create a token:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/settings/tokens/new" -ForegroundColor Gray
    Write-Host "2. Select scope: 'repo' (full control)" -ForegroundColor Gray
    Write-Host "3. Generate and copy the token" -ForegroundColor Gray
    Write-Host ""
    $GitHubToken = Read-Host "Paste your GitHub Personal Access Token"
}

if (-not $GitHubToken) {
    Write-Host "ERROR: Token is required" -ForegroundColor Red
    exit 1
}

Write-Host "Token configured" -ForegroundColor Green
Write-Host ""

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

# Check if branch exists, if not create it
Write-Host "🔍 Checking main branch..." -ForegroundColor Yellow
$branchUrl = "https://api.github.com/repos/$owner/$repo/branches"
try {
    $branchResponse = Invoke-RestMethod -Uri $branchUrl -Headers $headers -ErrorAction SilentlyContinue
    $mainExists = $branchResponse | Where-Object { $_.name -eq "main" }
    if (-not $mainExists) {
        Write-Host "ℹ Main branch doesn't exist yet. Will be created on first commit." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Main branch found" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ Unable to verify branch (may be first push)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Preparing files for upload..." -ForegroundColor Yellow

$filesToUpload = Get-ChildItem -Path $projectPath -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($path -like "*node_modules*") -and `
    -not ($path -like "*dist*") -and `
    -not ($path -like "*.git*") -and `
    -not ($path -like "*.vscode*") -and `
    -not ($path -like "*\.DS_Store*")
}

Write-Host "Found $($filesToUpload.Count) files to upload" -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0
$fileIndex = 0

foreach ($file in $filesToUpload) {
    $fileIndex++
    $relativePath = $file.FullName.Replace($projectPath, "").TrimStart("\").Replace("\", "/")
    
    if ($relativePath -match "\.exe$|\.dll$|\.node$|\.wasm$") {
        continue
    }
    
    Write-Host "[$fileIndex/$($filesToUpload.Count)] Uploading: $relativePath" -ForegroundColor Cyan
    
    try {
        $fileContent = [System.IO.File]::ReadAllBytes($file.FullName)
        $base64Content = [Convert]::ToBase64String($fileContent)
        
        $uploadUrl = "https://api.github.com/repos/$owner/$repo/contents/$relativePath"
        
        $body = @{
            message = "Add $relativePath"
            content = $base64Content
            branch = $branch
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $uploadUrl -Method Put -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "  OK" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "Upload Summary" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Successful: $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount files" -ForegroundColor Red
}
Write-Host ""
Write-Host "Repository: https://github.com/$owner/$repo" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "SUCCESS! Project pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "ERROR: No files uploaded" -ForegroundColor Red
}

Write-Host ""
