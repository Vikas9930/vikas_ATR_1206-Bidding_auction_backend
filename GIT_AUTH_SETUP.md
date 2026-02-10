# Git Authentication Setup for GitHub

## Problem
GitHub no longer accepts passwords for HTTPS authentication. You need to use either:
1. **Personal Access Token (PAT)** - Recommended for HTTPS
2. **SSH Key** - More secure, better for long-term use

---

## Option 1: Use Personal Access Token (HTTPS) - Quickest

### Step 1: Create Personal Access Token on GitHub

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "LiveBid Backend")
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Use Token When Pushing

When Git asks for password, use the **Personal Access Token** instead:

```bash
# Push with token
git push origin main

# When prompted:
# Username: Vikas9930
# Password: <paste your Personal Access Token here>
```

### Step 3: Save Credentials (Optional)

To avoid entering token every time:

```bash
# Configure Git credential helper
git config --global credential.helper store

# Then push (enter token once, it will be saved)
git push origin main
```

---

## Option 2: Use SSH (More Secure) - Recommended

### Step 1: Check if SSH Key Exists

```bash
ls -al ~/.ssh
```

### Step 2: Generate SSH Key (if needed)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Enter passphrase (optional but recommended)
```

### Step 3: Add SSH Key to GitHub

```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

### Step 4: Change Remote to SSH

```bash
cd /data/Ai_backend/backend
git remote set-url origin git@github.com:Vikas9930/vikas_ATR_1206-Bidding_auction_backend.git
```

### Step 5: Test SSH Connection

```bash
ssh -T git@github.com
```

You should see: "Hi Vikas9930! You've successfully authenticated..."

### Step 6: Push

```bash
git push origin main
```

---

## Option 3: Use GitHub CLI (gh)

### Install GitHub CLI

```bash
# Ubuntu/Debian
sudo apt install gh

# Or download from: https://cli.github.com/
```

### Authenticate

```bash
gh auth login

# Follow prompts:
# - Choose GitHub.com
# - Choose HTTPS
# - Authenticate via browser or token
```

### Push

```bash
git push origin main
```

---

## Quick Fix: Update Remote URL with Token Embedded

**⚠️ Not recommended for security, but works:**

```bash
# Replace YOUR_TOKEN with your Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/Vikas9930/vikas_ATR_1206-Bidding_auction_backend.git

# Then push
git push origin main
```

---

## Troubleshooting

### Error: "Permission denied (publickey)"
- You're using SSH but haven't added your SSH key to GitHub
- Solution: Use Option 2 above

### Error: "Authentication failed"
- Using HTTPS but password/token is wrong
- Solution: Use Option 1 (Personal Access Token)

### Error: "Repository not found"
- Repository doesn't exist or you don't have access
- Solution: Check repository exists and you have write access

---

## Recommended Approach

**For quick setup:** Use Option 1 (Personal Access Token)
**For long-term:** Use Option 2 (SSH)

