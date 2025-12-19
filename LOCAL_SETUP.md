# DoForYou - Local Development Setup

This document describes how to run the DoForYou application completely on localhost without any cloud dependencies (Vercel, Railway, etc.).

## Overview

All Vercel and Railway configurations have been removed. Both the frontend and backend are now configured to run entirely on localhost.

## Configuration Changes

### Frontend Changes

All environment files now point to localhost:

- **environment.ts** (default): `http://localhost:5018`
- **environment.dev.ts**: `http://localhost:5018`
- **environment.qa.ts**: `http://localhost:5018`
- **environment.prod.ts**: `http://localhost:5018`

Environment variable files updated:
- `.env.development`
- `.env.production`
- `.env.qa`

Removed files:
- `vercel.json`
- `railway.json`

### Backend Changes

Updated configuration files:
- **appsettings.json**: Already configured for localhost
- **appsettings.Development.json**: Already configured for localhost
- **appsettings.Production.json**: Updated to use localhost
- **appsettings.QA.json**: Updated to use localhost

Updated **Program.cs**:
- Removed Railway PORT environment variable detection
- Removed PostgreSQL/Railway database configuration
- Simplified to use SQLite only
- Removed environment variable-based JWT configuration
- Simplified CORS to only allow localhost:4200
- Swagger now only enabled in Development mode

Removed files:
- `railway.json`

## Running the Application

### Prerequisites

- Node.js (v18 or higher)
- .NET 8.0 SDK
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd /Users/obakengmokolare/Documents/DFY/BE-FE/DoForYouBackend/DoForYouBackend.API
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Run the backend:
   ```bash
   dotnet run
   ```

   The backend will start on `http://localhost:5018`
   Swagger UI will be available at `http://localhost:5018/swagger`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd /Users/obakengmokolare/Documents/DFY/BE-FE/DoForYou
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend:
   ```bash
   ng serve
   ```

   The frontend will start on `http://localhost:4200`

## Database

The application uses SQLite for local development:
- Database file: `doforyou.db` (created automatically)
- Development database: `doforyou-dev.db`
- QA database: `doforyou-qa.db`
- Production database: `doforyou-prod.db`

The database will be automatically created and seeded when you first run the backend.

## API Endpoints

All API endpoints are now accessible at:
- Base URL: `http://localhost:5018`
- Swagger Documentation: `http://localhost:5018/swagger`
- Health Check: `http://localhost:5018/health`
- SignalR Hub: `http://localhost:5018/taskHub`

## Environment Variables

### Frontend
No external environment variables are required. All configuration is in the environment files.

### Backend
The following can be configured in `appsettings.json`:
- JWT Key (defaults to development key if not set)
- Email SMTP settings
- SMS API settings
- PayFast settings (sandbox mode by default)

## Troubleshooting

### Backend won't start
- Ensure port 5018 is not in use
- Check that .NET 8.0 SDK is installed: `dotnet --version`
- Delete the database files and let them be recreated

### Frontend won't start
- Ensure port 4200 is not in use
- Clear Angular cache: `rm -rf .angular/cache`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### CORS errors
- Ensure the backend is running before starting the frontend
- Check that the backend CORS policy allows `http://localhost:4200`

### Database errors
- Delete the `.db` files and restart the backend
- Check file permissions in the backend directory

## Development Workflow

1. Start the backend first (it will create the database)
2. Start the frontend
3. Access the application at `http://localhost:4200`
4. API documentation at `http://localhost:5018/swagger`

## Notes

- All cloud deployment configurations have been removed
- The application is now fully self-contained for local development
- No external services (Vercel, Railway, etc.) are required
- Database is SQLite (file-based, no server required)
- All URLs are hardcoded to localhost for simplicity
