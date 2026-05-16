# Pushing Floating AI to GitHub

Choose one of the methods below to push the project to GitHub.

## Method 1: VS Code Built-in Git (Recommended - No Installation Required)

1. **Open the project in VS Code**
   - Open folder: `c:\Users\kowshik kailas\T_three\floating-ai`

2. **Initialize Git Repository**
   - Press `Ctrl + Shift + G` to open Source Control
   - Click "Initialize Repository" (or the git icon)

3. **Stage All Files**
   - Click the `+` icon next to "Changes" to stage all files

4. **Create Initial Commit**
   - Type in the message box:
     ```
     Initial commit: Floating AI desktop assistant - Production-grade Electron+React overlay
     ```
   - Press `Ctrl + Enter` or click the checkmark to commit

5. **Add Remote**
   - Open integrated terminal (`Ctrl + ` `)
   - Run:
     ```powershell
     git remote add origin https://github.com/suraj-mm/IBM-BOB-PROJECT.git
     git branch -M main
     ```

6. **Publish to GitHub**
   - Click "Publish Branch" button in Source Control panel
   - You'll be prompted to sign in to GitHub in VS Code
   - Select your account and authenticate

7. **Done!**
   - Your code is now on GitHub at `https://github.com/suraj-mm/IBM-BOB-PROJECT`

---

## Method 2: Command Line (After Installing Git)

1. **Install Git**
   - Download from: https://git-scm.com/download/win
   - Run the installer and follow defaults

2. **Navigate to project**
   ```powershell
   cd "c:\Users\kowshik kailas\T_three\floating-ai"
   ```

3. **Run the automated push script**
   ```powershell
   .\push-to-github.bat
   ```
   - It will prompt for your Git username and email
   - Then push automatically

OR run manually:

```powershell
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: Floating AI desktop assistant"
git remote add origin https://github.com/suraj-mm/IBM-BOB-PROJECT.git
git branch -M main
git push -u origin main
```

---

## What Gets Pushed

✓ All source code (Electron, React, Agent)
✓ Configuration files (package.json, vite.config.js, etc.)
✓ README.md and documentation
✗ node_modules/ (ignored)
✗ dist/ (ignored)
✗ .vscode/ (ignored)

---

## Verify Success

Check GitHub:
1. Go to `https://github.com/suraj-mm/IBM-BOB-PROJECT`
2. You should see:
   - All files in root directory
   - Project folders: `electron/`, `agent/`, `src/`, `backend/`
   - README.md displayed on main page
   - Commit history showing "Initial commit"

---

**Need Help?**
- If GitHub authentication fails in VS Code, try: `Ctrl+Shift+P` → "Git: Create Terminal"
- For command-line issues, ensure Git is in your PATH after installation
