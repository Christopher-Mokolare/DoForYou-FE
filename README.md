# DoForYou

> A modern task marketplace platform connecting users with service providers in real-time.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- .NET 8.0 SDK
- Angular CLI

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start backend** (separate terminal)
   ```bash
   cd ../DoForYouBackend/DoForYouBackend.API
   dotnet run
   ```

3. **Start frontend**
   ```bash
   ng serve
   ```

4. **Access application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5018
   - Swagger UI: http://localhost:5018/swagger

## 🏗️ Tech Stack

- **Frontend**: Angular 19, Angular Material, Bootstrap 5
- **Backend**: .NET 8, SignalR, SQLite/PostgreSQL
- **Features**: PWA, Real-time notifications, Payment integration

## 📚 Documentation

For complete system documentation, architecture details, and development guides, see [SYSTEM.md](./docs/SYSTEM.md).

## 🛠️ Development

```bash
# Development server
npm start

# Build for production
npm run build:prod

# Run tests
npm test

# Generate component
ng generate component component-name
```

## 📄 License

This project is licensed under the MIT License.
