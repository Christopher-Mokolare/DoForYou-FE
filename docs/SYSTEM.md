# DoForYou - Complete System Documentation

## 📋 Project Overview

**DoForYou** is a modern task marketplace platform built with Angular 19 and .NET 8, enabling users to post tasks and connect with service providers (runners) in real-time.

### Key Features
- 🎯 Task posting and management
- 👥 User authentication and profiles
- 💰 Integrated payment processing (PayFast)
- 📍 Location-based task matching
- 💬 Real-time notifications (SignalR)
- 📱 Progressive Web App (PWA)
- 🔐 Role-based access control (Admin/User/Runner)

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Angular 19.2.0 with Standalone Components
- **UI Library**: Angular Material + Bootstrap 5
- **State Management**: RxJS + Angular Signals
- **Real-time**: SignalR Client
- **Maps**: Google Maps integration
- **Styling**: SCSS + Bootstrap utilities
- **Build Tool**: Angular CLI with Webpack

### Backend Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Authentication**: JWT Bearer tokens
- **Real-time**: SignalR Hubs
- **Payment**: PayFast integration
- **Email**: SMTP integration
- **API Documentation**: Swagger/OpenAPI

### Development Environment
- **Node.js**: v18+
- **Angular CLI**: v19.2.14
- **.NET SDK**: 8.0
- **Package Manager**: npm

## 📁 Project Structure

```
DoForYou/
├── src/app/
│   ├── admin/                    # Admin panel components
│   │   ├── admin-dashboard/
│   │   ├── admin-payments/
│   │   ├── admin-tasks/
│   │   └── admin-users/
│   ├── auth/                     # Authentication
│   │   ├── login/
│   │   └── register/
│   ├── features/                 # Feature modules
│   │   ├── dashboard/
│   │   ├── payments/
│   │   ├── tasks/
│   │   └── user-management/
│   ├── guards/                   # Route guards
│   ├── interceptors/             # HTTP interceptors
│   ├── layout/                   # Layout components
│   │   ├── header/
│   │   └── footer/
│   ├── models/                   # TypeScript interfaces
│   ├── pages/                    # Static pages
│   │   ├── home/
│   │   ├── about/
│   │   ├── contact/
│   │   └── testimonials/
│   ├── pipes/                    # Custom pipes
│   ├── services/                 # Application services
│   └── shared/                   # Shared components
├── src/assets/                   # Static assets
│   ├── images/
│   ├── styles/
│   └── videos/
├── src/environments/             # Environment configs
└── docs/                        # Documentation
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js (v18+)
node --version

# Install Angular CLI
npm install -g @angular/cli

# Verify .NET SDK
dotnet --version
```

### Local Development Setup

1. **Clone and Setup Frontend**
```bash
cd DoForYou
npm install
```

2. **Start Backend** (in separate terminal)
```bash
cd ../DoForYouBackend/DoForYouBackend.API
dotnet restore
dotnet run
# Backend runs on http://localhost:5018
```

3. **Start Frontend**
```bash
ng serve
# Frontend runs on http://localhost:4200
```

4. **Access Application**
- Frontend: http://localhost:4200
- Backend API: http://localhost:5018
- Swagger UI: http://localhost:5018/swagger

## 🔧 Configuration

### Environment Files
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5018',
  signalRUrl: 'http://localhost:5018/taskHub',
  googleMapsApiKey: 'your-api-key',
  payFastMerchantId: 'sandbox-merchant-id'
};
```

### Backend Configuration
```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=doforyou.db"
  },
  "JwtSettings": {
    "Key": "your-secret-key",
    "Issuer": "DoForYou",
    "Audience": "DoForYou-Users",
    "ExpiryInHours": 24
  },
  "PayFast": {
    "MerchantId": "sandbox-merchant-id",
    "MerchantKey": "sandbox-merchant-key",
    "IsSandbox": true
  }
}
```

## 🎯 Core Features

### 1. User Management
- **Registration/Login**: JWT-based authentication
- **Profile Management**: User preferences and settings
- **Role System**: Admin, User, Runner roles
- **User Type Toggle**: Switch between task poster and runner

### 2. Task Management
- **Post Tasks**: Create tasks with location, budget, description
- **Browse Tasks**: Filter and search available tasks
- **Task Tracking**: Real-time status updates
- **Task Details**: Comprehensive task information

### 3. Payment System
- **PayFast Integration**: Secure payment processing
- **Payment Tracking**: Transaction history and status
- **Refund Management**: Automated refund processing
- **Payment Notifications**: Real-time payment updates

### 4. Real-time Features
- **SignalR Integration**: Live notifications and updates
- **Location Tracking**: Real-time location updates
- **Task Status**: Live task progress tracking
- **Chat System**: In-app messaging

### 5. Admin Panel
- **User Management**: View and manage all users
- **Task Oversight**: Monitor all tasks and transactions
- **Payment Management**: Handle payment disputes
- **System Analytics**: Usage statistics and reports

## 🔐 Security Features

### Authentication & Authorization
```typescript
// JWT Token Guard
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return this.authService.isAuthenticated();
  }
}

// Role-based Guard
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(): boolean {
    return this.authService.hasRole('Admin');
  }
}
```

### Security Headers
- CORS configuration for localhost development
- JWT token validation
- Input sanitization
- SQL injection prevention

## 📱 Progressive Web App (PWA)

### Service Worker Features
- Offline functionality
- Background sync
- Push notifications
- App-like experience

### Installation
```bash
# Add PWA support
ng add @angular/pwa
```

## 🧪 Testing

### Unit Testing
```bash
# Run unit tests
ng test

# Run with coverage
ng test --code-coverage
```

### E2E Testing
```bash
# Run end-to-end tests
ng e2e
```

## 📦 Build & Deployment

### Development Build
```bash
ng build --configuration development
```

### Production Build
```bash
ng build --configuration production
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/do-for-you /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/location` - Update location

### Payments
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/webhook` - PayFast webhook
- `GET /api/payments/history` - Payment history

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend is running on port 5018
   - Check CORS configuration in backend

2. **Database Issues**
   - Delete `.db` files and restart backend
   - Check file permissions

3. **Build Errors**
   - Clear Angular cache: `rm -rf .angular/cache`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

4. **SignalR Connection Issues**
   - Verify SignalR hub URL in environment
   - Check network connectivity

### Performance Optimization

1. **Lazy Loading**
   - Feature modules are lazy-loaded
   - Reduces initial bundle size

2. **OnPush Change Detection**
   - Used in performance-critical components
   - Reduces change detection cycles

3. **TrackBy Functions**
   - Implemented for large lists
   - Improves rendering performance

## 📊 Monitoring & Analytics

### Application Insights
- Error tracking and logging
- Performance monitoring
- User behavior analytics

### Health Checks
- Database connectivity
- External service availability
- System resource monitoring

## 🔮 Future Enhancements

### Planned Features
- [ ] AI-powered task matching
- [ ] Advanced location tracking
- [ ] Multi-language support
- [ ] Mobile app (Ionic/React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with more payment providers

### Technical Improvements
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced caching strategies
- [ ] GraphQL API
- [ ] Real-time collaboration features

## 📚 Additional Resources

### Documentation
- [Angular Documentation](https://angular.dev)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)
- [PayFast Documentation](https://developers.payfast.co.za/)

### Development Tools
- [Angular DevTools](https://angular.io/guide/devtools)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) for API testing

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Submit pull request
4. Code review and approval
5. Merge to main

### Code Standards
- Follow Angular style guide
- Use TypeScript strict mode
- Implement comprehensive error handling
- Write unit tests for new features
- Document public APIs

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: DoForYou Development Team