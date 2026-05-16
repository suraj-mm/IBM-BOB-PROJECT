# Push to GitHub Without Git or GitHub Desktop

This script uses the **GitHub REST API** to push files directly—no installation required.

## 🔑 Step 1: Get GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Give it a name: `Floating AI Push`
3. Select scope: **✓ repo** (full control of private repositories)
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)
6. Keep it safe—don't share it

## 🚀 Step 2: Run the Push Script

Open PowerShell and run:

```powershell
cd "c:\Users\kowshik kailas\T_three\floating-ai"
.\push-via-api.ps1
```

When prompted, paste your GitHub Personal Access Token.

---

## ✅ That's It!

The script will:
- ✓ Connect to GitHub via REST API
- ✓ Upload all project files
- ✓ Automatically create commits
- ✓ Push to the main branch
- ✓ Display upload summary

Check your repo at: https://github.com/suraj-mm/IBM-BOB-PROJECT

---

## 🔒 Security Notes

- Your token is only used during this session
- Never commit your token to git
- You can regenerate or revoke tokens at: https://github.com/settings/tokens
- The token expires/can be deleted after use

---

## ❌ Troubleshooting

**"Bad credentials" error:**
- Token is invalid or expired
- Generate a new token from: https://github.com/settings/tokens

**"Repository not found" error:**
- Make sure the repo exists: https://github.com/suraj-mm/IBM-BOB-PROJECT
- Check the owner name is correct

**Script permission denied:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\push-via-api.ps1
```

---

**Questions?** Check the script comments or create a GitHub issue.
