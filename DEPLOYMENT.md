# Deployment Guide

## Environment Setup

### Branch Strategy
- `dev` - Development environment (auto-deploys to dev)
- `qa` - QA environment (auto-deploys to QA after tests pass)
- `main` - Production environment (auto-deploys to production after tests pass)

### Deployment Flow
1. **Development**: Push to `dev` branch → Auto-deploy to dev environment
2. **QA Testing**: Create PR from `dev` to `qa` → Merge after review → Auto-deploy to QA
3. **Production**: Create PR from `qa` to `main` → Merge after QA approval → Auto-deploy to production

## Environment Commands

### Local Development
```bash
npm run start:dev    # Serve with development config
npm run build:dev    # Build for development
```

### QA Environment
```bash
npm run start:qa     # Serve with QA config
npm run build:qa     # Build for QA
```

### Production Environment
```bash
npm run build:prod   # Build for production
```

## GitHub Secrets Required

Add these secrets in your GitHub repository settings:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

## Environment URLs

- **Development**: Local development server
- **QA**: https://api-qa.doforyou.co.za
- **Production**: https://api.doforyou.co.za

## Safety Features

1. **No direct pushes to production**: All changes must go through dev → qa → main
2. **Automated testing**: Tests run before any deployment
3. **Environment isolation**: Each environment has separate configurations
4. **Protected branches**: QA and main branches require PR reviews

## Quick Start

1. Clone repository
2. Copy `.env.example` to `.env.development`
3. Update environment variables
4. Run `npm install`
5. Run `npm run start:dev`