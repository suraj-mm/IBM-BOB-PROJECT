#!/usr/bin/env python3
"""Floating AI - GitHub Push via REST API (No Git Required)"""

import os
import base64
import requests
import json
import time
from pathlib import Path

PROJECT_PATH = r"c:\Users\kowshik kailas\T_three\floating-ai"
OWNER = "suraj-mm"
REPO = "IBM-BOB-PROJECT"
BRANCH = "main"

def get_token():
    """Get GitHub Personal Access Token from user"""
    print("=" * 50)
    print("Floating AI - GitHub Push via REST API")
    print("=" * 50)
    print()
    print("GitHub Personal Access Token Required")
    print()
    print("To create a token:")
    print("1. Go to: https://github.com/settings/tokens/new")
    print("2. Select scope: 'repo' (full control)")
    print("3. Generate and copy the token")
    print()
    
    token = input("Paste your GitHub Personal Access Token: ").strip()
    if not token:
        print("ERROR: Token is required")
        exit(1)
    return token

def get_files_to_upload(base_path):
    """Get all files to upload, excluding certain directories"""
    files = []
    exclude_dirs = {'node_modules', 'dist', '.git', '.vscode'}
    exclude_files = {'.DS_Store'}
    
    for root, dirs, filenames in os.walk(base_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in filenames:
            if filename in exclude_files:
                continue
            if filename.endswith(('.exe', '.dll', '.node', '.wasm')):
                continue
            
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, base_path).replace('\\', '/')
            files.append((full_path, rel_path))
    
    return sorted(files)

def upload_file(token, file_path, relative_path):
    """Upload a single file to GitHub"""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        base64_content = base64.b64encode(content).decode('utf-8')
        
        url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{relative_path}"
        
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "message": f"Add {relative_path}",
            "content": base64_content,
            "branch": BRANCH
        }
        
        response = requests.put(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code in (200, 201):
            return True, "OK"
        else:
            return False, response.text
    
    except Exception as e:
        return False, str(e)

def main():
    token = get_token()
    print()
    print("Preparing files for upload...")
    
    files = get_files_to_upload(PROJECT_PATH)
    print(f"Found {len(files)} files to upload")
    print()
    
    success_count = 0
    fail_count = 0
    
    for index, (file_path, rel_path) in enumerate(files, 1):
        print(f"[{index}/{len(files)}] Uploading: {rel_path}", end=" ")
        
        success, message = upload_file(token, file_path, rel_path)
        
        if success:
            print("OK")
            success_count += 1
        else:
            print(f"FAILED: {message}")
            fail_count += 1
        
        time.sleep(0.2)
    
    print()
    print("=" * 50)
    print("Upload Summary")
    print("=" * 50)
    print(f"Successful: {success_count} files")
    if fail_count > 0:
        print(f"Failed: {fail_count} files")
    print()
    print(f"Repository: https://github.com/{OWNER}/{REPO}")
    print()
    
    if success_count > 0:
        print("SUCCESS! Project pushed to GitHub")
    else:
        print("ERROR: No files uploaded")
    print()

if __name__ == "__main__":
    main()
