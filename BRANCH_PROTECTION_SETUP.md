# Branch Protection Setup Guide

## Recommended Git Flow

### 1. Feature Development Workflow
```bash
# Create feature branch from main-dev
git checkout main-dev
git pull origin main-dev
git checkout -b feature/your-feature-name

# Work on your feature
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Create PR to main-dev
# After approval and merge → Auto-deploy to dev environment
```

### 2. QA Release Workflow
```bash
# Create PR from main-dev to main-qa
# After approval and merge → Auto-deploy to QA environment
```

### 3. Production Release Workflow
```bash
# Create PR from main-qa to main
# After approval and merge → Auto-deploy to production
```

## GitHub Branch Protection Rules

### Set up these rules in GitHub repository settings:

#### For `main-dev` branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Allow force pushes: NO
- ✅ Allow deletions: NO

#### For `main-qa` branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Allow force pushes: NO
- ✅ Allow deletions: NO
- ✅ Restrict pushes that create files: Only from main-dev

#### For `main` branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Allow force pushes: NO
- ✅ Allow deletions: NO
- ✅ Restrict pushes that create files: Only from main-qa

## Development Flow

### Daily Development:
1. **Create feature branch** from `main-dev`
2. **Develop and test** locally
3. **Push feature branch** to GitHub
4. **Create PR** to `main-dev`
5. **Code review** and approval
6. **Merge PR** → Auto-deploy to dev environment

### QA Testing:
1. **Create PR** from `main-dev` to `main-qa`
2. **QA review** and approval
3. **Merge PR** → Auto-deploy to QA environment

### Production Release:
1. **Create PR** from `main-qa` to `main`
2. **Final approval** and merge
3. **Merge PR** → Auto-deploy to production

## Benefits:
- ✅ **main-dev** is always the source of truth for development
- ✅ **No direct pushes** to protected branches
- ✅ **Code review required** for all changes
- ✅ **Automated testing** before deployment
- ✅ **Clear promotion path**: feature → dev → qa → production