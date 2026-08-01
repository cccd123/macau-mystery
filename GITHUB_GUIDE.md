# GitHub Team Workflow Guide

## 1. First Time Setup

### Create `.gitignore` check
Make sure these exist (already configured):
- `.gitignore` (root) - ignores node_modules, __pycache__, .env, etc.

### Set up GitHub Repository

1. Go to https://github.com/new
2. Repository name: `macau-mystery`
3. Make it **Private** (for competition)
4. **Do NOT** initialize with README (we already have files)

### Push existing project

```powershell
cd D:\macau-mystery

# First time only - set remote
git remote add origin https://github.com/YOUR_USERNAME/macau-mystery.git

# Push
git add -A
git commit -m "feat: v0.2 complete platform scaffold with i18n"
git branch -M main
git push -u origin main
```

### Invite Team Members

1. Go to repo Settings > Collaborators
2. Click "Add people"
3. Add all 4 team members with **Write** access

---

## 2. Branch Protection (Set up ONCE by Person D)

### Protect main branch
1. Go to repo Settings > Branches > Add rule
2. Branch name pattern: `main`
3. Enable:
   - [x] Require a pull request before merging
   - [x] Require approvals: 1
   - [x] Dismiss stale pull request approvals when new commits are pushed
4. Click "Create"

This means: **Nobody can push directly to `main`. All changes go through PR review.**

---

## 3. Daily Workflow (Everyone)

### Step 1: Get latest code
```powershell
cd D:\macau-mystery
git checkout main
git pull origin main
```

### Step 2: Create your feature branch
```powershell
# Naming convention: <person>-<feature>
git checkout -b a-hero-redesign       # Person A
git checkout -b b-business-plan       # Person B
git checkout -b c-siliconflow-integration  # Person C
git checkout -b d-my-scripts-page     # Person D
```

### Step 3: Work on your task
```powershell
# Make changes...
# Save frequently
git add -A
git commit -m "feat: add hero background animation"

# If working over multiple days:
git add -A
git commit -m "feat: progress on hero redesign"
```

### Step 4: Push your branch
```powershell
git push origin YOUR-BRANCH-NAME
# Example: git push origin a-hero-redesign
```

### Step 5: Create Pull Request (on GitHub)
1. Go to https://github.com/YOUR_USERNAME/macau-mystery
2. You'll see a banner: "a-hero-redesign had recent pushes" - click **Compare & pull request**
3. Or: Click "Pull requests" tab > "New pull request"
4. Set: base=`main` compare=`your-branch`
5. Title: `[A] Hero redesign with Azulejo background`
6. Description: What you changed, which files
7. Click "Create pull request"

### Step 6: Request Review
1. On the PR page, click the gear icon next to "Reviewers"
2. Select Person D (or any teammate)
3. Wait for approval

### Step 7: Merge (Person D)
1. Reviewer checks: build passes, no errors, looks good
2. Click "Merge pull request" > "Confirm merge"
3. Click "Delete branch" to clean up

---

## 4. Handling Conflicts

If someone else changed the same file:

```powershell
# On your branch:
git stash                    # Save your changes
git checkout main
git pull origin main
git checkout YOUR-BRANCH
git rebase main              # Apply your changes on top of latest

# If conflicts appear:
# 1. Open the conflicting file
# 2. Look for <<<<<<< markers
# 3. Choose which version to keep (or merge both)
# 4. Remove the markers
# 5. git add . && git rebase --continue

git stash pop                # Restore your changes
```

---

## 5. Commit Message Convention

Use prefixes for clarity:
```
feat: add language switcher component
fix: resolve game API response format mismatch
docs: add business plan draft
style: update theme colors to Azulejo blue
refactor: simplify auth token validation
test: add UGC generation test cases
```

---

## 6. Quick Reference Commands

```powershell
# Check what's changed
git status
git diff

# Undo last commit (keep changes)
git reset HEAD~1

# Discard all changes (DANGEROUS)
git checkout -- .

# View commit history
git log --oneline -10

# See who changed what
git blame path/to/file

# Start fresh from main
git checkout main
git pull origin main
git branch -D old-branch
git checkout -b new-branch
```

---

## 7. Version Tags (Person D)

When reaching milestones:
```powershell
git tag v0.3 -m "Real AI integration complete"
git push origin v0.3

git tag v0.4 -m "UI polish complete"
git push origin v0.4
```

---

## 8. Emergency: Something Broke Main

```powershell
# Revert last merge
git revert -m 1 HEAD
git push origin main

# Or reset to a known good commit
git log --oneline          # Find the good commit hash
git reset --hard abc123    # Go back to it
git push origin main --force  # Only if absolutely necessary!
```

---

## 9. Tips for Zero-Base Team

1. **Always `git pull` before starting work** - avoids most conflicts
2. **Commit small and often** - easier to understand what changed
3. **One branch = one task** - don't mix unrelated changes
4. **Test before pushing** - run `npm run build` (frontend) and start uvicorn (backend)
5. **Ask for help in group chat** before force-pushing anything
6. **Never delete main branch**
7. **If stuck on conflicts, ask Person D**
