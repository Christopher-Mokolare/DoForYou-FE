# Backend Environment Setup Guide

## Railway Services Setup

### 1. Create Railway Services

Create 3 separate Railway services:

#### Development Service
- **Name**: `doforyou-backend-dev`
- **Domain**: `doforyou-backend-dev.up.railway.app`
- **Branch**: `main-dev`

#### QA Service  
- **Name**: `doforyou-backend-qa`
- **Domain**: `doforyou-backend-qa.up.railway.app`
- **Branch**: `main-qa`

#### Production Service (Existing)
- **Name**: `doforyou-backend-prod`
- **Domain**: `api.doforyou.co.za`
- **Branch**: `main`

### 2. Environment Variables per Service

#### Development Environment Variables
```
BACKEND_URL=https://doforyou-backend-dev.up.railway.app
DB_CONNECTION_STRING=Data Source=doforyou-dev.db
FROM_EMAIL=dev@doforyou.co.za
FRONTEND_URL=https://dev-doforyou.vercel.app
JWT_AUDIENCE=DoForYouClient-Dev
JWT_ISSUER=DoForYouAPI-Dev
JWT_SECRET_KEY=DoForYou2024DevSecureJWTKey123456789
PAYFAST_BASE_URL=https://sandbox.payfast.co.za/eng/process
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
SMS_API_KEY=dev-sms-api-key
SMS_API_URL=https://api.bulksms.com/v1/messages
SMS_SENDER=DoForYou-Dev
SMTP_HOST=smtp.gmail.com
SMTP_PASS=dev-app-password
SMTP_PORT=587
SMTP_USER=dev@doforyou.co.za
```

#### QA Environment Variables
```
BACKEND_URL=https://doforyou-backend-qa.up.railway.app
DB_CONNECTION_STRING=Data Source=doforyou-qa.db
FROM_EMAIL=qa@doforyou.co.za
FRONTEND_URL=https://qa-doforyou.vercel.app
JWT_AUDIENCE=DoForYouClient-QA
JWT_ISSUER=DoForYouAPI-QA
JWT_SECRET_KEY=DoForYou2024QASecureJWTKey123456789
PAYFAST_BASE_URL=https://sandbox.payfast.co.za/eng/process
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
SMS_API_KEY=qa-sms-api-key
SMS_API_URL=https://api.bulksms.com/v1/messages
SMS_SENDER=DoForYou-QA
SMTP_HOST=smtp.gmail.com
SMTP_PASS=qa-app-password
SMTP_PORT=587
SMTP_USER=qa@doforyou.co.za
```

#### Production Environment Variables (Current)
```
BACKEND_URL=https://api.doforyou.co.za
DB_CONNECTION_STRING=Data Source=doforyou.db
FROM_EMAIL=noreply@doforyou.co.za
FRONTEND_URL=https://do-for-you.vercel.app
JWT_AUDIENCE=DoForYouClient
JWT_ISSUER=DoForYouAPI
JWT_SECRET_KEY=DoForYou2024SecureJWTKeyForProductionUse123456789
PAYFAST_BASE_URL=https://www.payfast.co.za/eng/process
PAYFAST_MERCHANT_ID=19956849
PAYFAST_MERCHANT_KEY=ama6qvhsf8a2d
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.bulksms.com/v1/messages
SMS_SENDER=DoForYou
SMTP_HOST=smtp.gmail.com
SMTP_PASS=your-app-password
SMTP_PORT=587
SMTP_USER=noreply@doforyou.co.za
```

### 3. GitHub Secrets Required

Add these secrets to your GitHub repository:

```
# Railway Tokens (get from Railway dashboard)
RAILWAY_TOKEN_DEV=your-dev-railway-token
RAILWAY_TOKEN_QA=your-qa-railway-token  
RAILWAY_TOKEN_PROD=your-prod-railway-token

# Railway Service IDs
RAILWAY_SERVICE_DEV=your-dev-service-id
RAILWAY_SERVICE_QA=your-qa-service-id
RAILWAY_SERVICE_PROD=your-prod-service-id
```

### 4. Railway Setup Steps

1. **Create Services**: Create 3 Railway services from your backend repository
2. **Set Branches**: Configure each service to deploy from specific branches
3. **Add Variables**: Copy environment variables to each service
4. **Custom Domains**: Set up custom domains for QA and Production
5. **Auto Deploy**: Enable GitHub integration for automatic deployments

### 5. Deployment Flow

1. **Development**: Push to `main-dev` → Auto-deploy to Railway Dev service
2. **QA**: Merge `main-dev` to `main-qa` → Auto-deploy to Railway QA service  
3. **Production**: Merge `main-qa` to `main` → Auto-deploy to Railway Production service

### 6. Testing Endpoints

After setup, test each environment:

- **Dev**: `https://doforyou-backend-dev.up.railway.app/health`
- **QA**: `https://doforyou-backend-qa.up.railway.app/health`
- **Prod**: `https://api.doforyou.co.za/health`