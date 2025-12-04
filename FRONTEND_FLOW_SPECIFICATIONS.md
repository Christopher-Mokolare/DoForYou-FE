# DoForYou Frontend Implementation - Flow & Specifications

## Overview
DoForYou is an Angular 19 freelance platform that connects task creators with task runners. The frontend is built with a modern feature-based architecture using standalone components, lazy loading, and comprehensive authentication/authorization.

## Architecture

### Technology Stack
- **Framework**: Angular 19.2.0
- **Language**: TypeScript 5.7.2
- **Styling**: Bootstrap 5.3.8 + SCSS
- **Animations**: GSAP 3.13.0
- **Icons**: Bootstrap Icons + FontAwesome
- **Real-time**: SignalR 8.0.0
- **Build Tool**: Angular CLI 19.2.14

### Project Structure
```
src/app/
├── admin/                    # Admin functionality
├── auth/                     # Authentication components
├── features/                 # Feature modules (lazy loaded)
│   ├── dashboard/           # User dashboard
│   ├── payments/            # Payment handling
│   ├── tasks/               # Task management
│   └── user-management/     # User profile & preferences
├── layout/                  # Layout components (header, footer)
├── pages/                   # Static pages (home, about, contact)
├── shared/                  # Reusable components
├── services/                # Business logic services
├── guards/                  # Route protection
├── interceptors/            # HTTP interceptors
├── models/                  # TypeScript interfaces
└── pipes/                   # Custom pipes
```

## Application Flow

### 1. Authentication Flow

#### Login Process
1. User navigates to `/login`
2. `LoginComponent` captures credentials
3. `AuthService.login()` sends request to backend
4. On success:
   - JWT token stored in localStorage
   - User object stored in localStorage
   - `currentUserSubject` updated
   - Default preferences set for new users
   - Redirect to intended route or dashboard

#### Registration Process
1. User navigates to `/register`
2. `RegisterComponent` captures user details
3. `AuthService.register()` sends request to backend
4. User redirected to login page

#### Authentication Guards
- `authGuard`: Protects authenticated routes
- `adminGuard`: Protects admin-only routes
- `ProfileCompletionGuard`: Ensures profile is complete

### 2. Task Management Flow

#### Browse Tasks (`/tasks/browse`)
1. `BrowseErrandsComponent` loads available tasks
2. `ErrandsService.getVerifiedTasks()` fetches paginated data
3. Tasks filtered by:
   - Payment status (verified, pending, failed)
   - Task status (posted, claimed, completed)
   - Location/area
   - Search terms
4. Real-time updates every 5 minutes
5. Users can accept tasks if authenticated and in "Task Runner" mode

#### Post Task (`/tasks/post`)
1. Protected route - requires authentication + profile completion
2. `PostErrandComponent` captures task details
3. `ErrandsService.createTask()` submits to backend
4. Task created with "draft" status
5. Payment integration for task verification

#### Task Details (`/tasks/:id`)
1. `TaskDetailsComponent` displays full task information
2. Shows task status, payment status, and runner details
3. Allows task acceptance for eligible users

#### Task Tracking (`/tasks/tracking`)
1. Shows user's accepted/created tasks
2. Real-time status updates
3. Progress tracking and completion workflow

### 3. User Management Flow

#### Dashboard (`/dashboard`)
1. `UserDashboardComponent` shows user overview
2. Task statistics and recent activity
3. Quick actions for posting/browsing tasks

#### Profile Management (`/user/profile`)
1. User can update personal information
2. Profile completion validation
3. Contact details management

#### User Preferences (`/user/preferences`)
1. Toggle between "Task Creator" and "Task Runner" modes
2. Notification preferences
3. Area preferences for task filtering

### 4. Payment Flow

#### Payment Success (`/payments/success`)
1. PayFast callback handling
2. Task status updated to "verified"
3. Task becomes available for runners

#### Payment Cancelled (`/payments/cancelled`)
1. Payment cancellation handling
2. Task remains in "draft" status
3. User can retry payment

### 5. Admin Flow

#### Admin Dashboard (`/admin/dashboard`)
1. System overview and statistics
2. Recent activity monitoring
3. Quick access to management functions

#### Admin Features
- **Tasks Management** (`/admin/tasks`): Monitor all tasks
- **User Management** (`/admin/users`): User administration
- **Payment Management** (`/admin/payments`): Payment oversight

## Key Services

### AuthService
- JWT token management
- User authentication state
- Role-based permissions
- Profile completion validation
- User preferences handling

### ErrandsService
- Task CRUD operations
- Pagination and filtering
- Real-time data caching
- Payment integration
- Task status management

### LoadingService
- Global loading state management
- UI loading indicators

### ModalService
- Centralized modal/alert system
- Confirmation dialogs
- Error messaging

## Data Models

### Task Model
```typescript
interface Task {
  id: number;
  taskId: string;
  userName: string;
  userContact: string;
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  paymentStatus: 'pending' | 'verified' | 'failed' | 'expired' | 'refunded';
  taskStatus: 'draft' | 'posted' | 'claimed' | 'in_progress' | 'completed' | 'confirmed';
  priority: 'standard' | 'urgent' | 'low';
  helperName?: string;
  helperContact?: string;
}
```

### User Model
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  roles: string[];
  isEmailConfirmed: boolean;
}
```

## Routing Configuration

### Main Routes
- `/` - Home page
- `/about` - About page
- `/contact` - Contact page
- `/login` - Authentication
- `/register` - User registration

### Feature Routes (Lazy Loaded)
- `/tasks/*` - Task management
- `/dashboard` - User dashboard
- `/payments/*` - Payment handling
- `/user/*` - User management
- `/admin/*` - Admin functionality

### Legacy Redirects
- `/browse-errands` → `/tasks/browse`
- `/post-errand` → `/tasks/post`
- `/profile` → `/user/profile`
- `/user-dashboard` → `/dashboard`

## Security Features

### Authentication
- JWT token-based authentication
- Automatic token validation
- Token expiry handling
- Secure logout process

### Authorization
- Role-based access control
- Route guards for protection
- Feature-level permissions
- Profile completion requirements

### HTTP Security
- Auth interceptor for token injection
- CSRF protection headers
- Error handling for auth failures
- Network error handling

## State Management

### User State
- `AuthService.currentUser$` - Observable user state
- localStorage for persistence
- Automatic state restoration

### Loading State
- `LoadingService.loading$` - Global loading indicator
- Component-level loading states

### Cache Management
- Service-level caching for API responses
- 30-second cache duration
- Manual cache clearing on updates

## UI/UX Features

### Responsive Design
- Bootstrap 5 grid system
- Mobile-first approach
- Responsive navigation

### Animations
- GSAP-powered animations
- Scroll-triggered effects
- Hover interactions
- Loading transitions

### User Experience
- Real-time updates
- Optimistic UI updates
- Error handling with user feedback
- Accessibility compliance

## Performance Optimizations

### Lazy Loading
- Feature modules loaded on demand
- Reduced initial bundle size
- Improved first load performance

### Caching
- API response caching
- Image optimization
- Service worker ready

### Bundle Optimization
- Tree shaking enabled
- Production builds optimized
- Minification and compression

## Development Workflow

### Build Commands
```bash
ng serve          # Development server
ng build          # Production build
ng test           # Unit tests
ng e2e            # End-to-end tests
```

### Environment Configuration
- Development: `http://localhost:5015` (C# backend)
- Production: Configurable API URL
- Feature flags and environment variables

## Integration Points

### Backend API
- RESTful API integration
- JWT authentication
- Error handling and retry logic
- Real-time updates via SignalR

### Payment Gateway
- PayFast integration
- Secure payment processing
- Callback handling
- Payment status tracking

### External Services
- WhatsApp integration for support
- Email notifications
- SMS notifications (configurable)

## Deployment

### Build Process
1. `ng build --configuration production`
2. Static files generated in `dist/`
3. Netlify deployment configuration
4. Environment-specific builds

### Hosting
- Netlify hosting with Angular runtime
- CDN distribution
- SSL/TLS encryption
- Custom domain support

## Monitoring & Analytics

### Error Handling
- Global error handler
- User-friendly error messages
- Console logging for debugging
- Network error detection

### Performance Monitoring
- Loading time tracking
- API response monitoring
- User interaction analytics

## Component Code Implementation

### Authentication Components

#### Login Component
```typescript
// src/app/auth/login/login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  returnUrl: string = '/';
  showPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loadingService.show();
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          this.loadingService.hide();
          if (response.success) {
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
          }
        },
        error: (error: any) => {
          this.loadingService.hide();
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
```

#### Register Component
```typescript
// src/app/auth/register/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  showPassword = false;
  showConfirmPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s()]+$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loadingService.show();
      this.errorMessage = '';
      
      const { confirmPassword, ...registerData } = this.registerForm.value;
      
      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          this.loadingService.hide();
          if (response.success) {
            this.router.navigate(['/login'], { 
              queryParams: { message: 'Registration successful! Please login.' }
            });
          } else {
            this.errorMessage = response.message || 'Registration failed. Please try again.';
          }
        },
        error: (error: any) => {
          this.loadingService.hide();
          this.errorMessage = 'Registration failed. Please try again.';
          console.error('Registration error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
```

### Task Management Components

#### Browse Errands Component
```typescript
// src/app/features/tasks/browse-errands/browse-errands.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { ErrandsService, Errand, PaginatedResponse } from '../../../services/errands.service';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { LoadingService } from '../../../services/loading.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-browse-errands',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, TruncatePipe, FormsModule],
  templateUrl: './browse-errands.component.html',
  styleUrls: ['./browse-errands.component.scss'],
  providers: [LoadingService]
})
export class BrowseErrandsComponent implements OnInit, OnDestroy {
  errands: Errand[] = [];
  isLoading = true;
  error: string | null = null;
  lastUpdated?: Date;
  refreshSubscription?: Subscription;
  searchSubject = new Subject<string>();
  searchSubscription?: Subscription;
  isLoggedIn = false;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 20, 50];

  // Filters
  searchTerm = '';
  statusFilter = '';
  categoryFilter = '';
  locationFilter = '';

  readonly taskRequestForm = environment.taskRequestForm;
  readonly whatsappNumber = environment.whatsappNumber;

  constructor(
    private errandsService: ErrandsService,
    private loadingService: LoadingService,
    public authService: AuthService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadErrands();
    this.setupAutoRefresh();
    this.setupSearch();

    // Subscribe to loading state
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Check authentication status
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      
      // Auto-accept task if returning from auth
      if (this.isLoggedIn) {
        this.checkAutoAccept();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  loadErrands(): void {
    this.loadingService.show();
    this.error = null;
    
    const filters = this.buildFilters();

    this.errandsService.getVerifiedTasks(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (data: PaginatedResponse) => {
        this.errands = data.tasks;
        this.totalItems = data.count;
        this.totalPages = data.totalPages;
        this.lastUpdated = new Date();
        this.loadingService.hide();
      },
      error: () => {
        this.error = 'Failed to load errands. Please try again later.';
        this.loadingService.hide();
      }
    });
  }

  acceptErrand(errand: Errand): void {
    if (!this.isLoggedIn) {
      const taskId = errand.taskId || errand.taskid;
      const returnUrl = encodeURIComponent(`/task/${taskId}?accept=true`);
      
      this.modalService.showConfirm(
        'Login Required',
        'You need to be logged in to accept tasks. Do you want to login or register?',
        () => window.location.href = `/login?returnUrl=${returnUrl}`,
        () => window.location.href = `/register?returnUrl=${returnUrl}`
      );
      return;
    }

    // Check if user can accept tasks based on preferences
    if (!this.authService.canAcceptTasks()) {
      this.modalService.showAlert(
        'Permission Required', 
        'You have selected "Task Creator" mode. To accept tasks, please update your preferences to "Task Runner" or "Both" in your profile settings.',
        'warning'
      );
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.modalService.showAlert('Authentication Required', 'Please log in to accept tasks', 'warning');
      return;
    }

    const taskId = errand.taskId || errand.taskid;
    if (!taskId) {
      this.modalService.showAlert('Invalid Task', 'Invalid task ID', 'error');
      return;
    }

    // Call automated API to claim task
    this.errandsService.claimTask(taskId, currentUser.name, currentUser.contact).subscribe({
      next: () => {
        this.modalService.showAlert('Success', 'Task accepted successfully! You can now start working on it.', 'success');
        this.loadErrands(); // Refresh the list
      },
      error: (error) => {
        this.modalService.showAlert('Error', 'Failed to accept task. Please try again.', 'error');
      }
    });
  }

  private buildFilters(): any {
    const filters: any = {};
    
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.taskStatus = this.statusFilter;
    if (this.categoryFilter) filters.category = this.categoryFilter;
    if (this.locationFilter) filters.area = this.locationFilter;

    return filters;
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadErrands();
    });
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadErrands();
    });
  }

  private checkAutoAccept(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const acceptTaskId = urlParams.get('accept');
    
    if (acceptTaskId) {
      // Find the task and auto-accept it
      const task = this.errands.find(e => (e.taskId || e.taskid) === acceptTaskId);
      if (task) {
        this.acceptErrand(task);
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/browse-errands');
    }
  }
}
```

#### Post Errand Component
```typescript
// src/app/features/tasks/post-errand/post-errand.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrandsService, CreateTaskData } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-post-errand',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './post-errand.component.html',
  styleUrls: ['./post-errand.component.scss']
})
export class PostErrandComponent implements OnInit {
  taskForm: FormGroup;
  isSubmitting = false;
  submitted = false;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private errandsService: ErrandsService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router
  ) {
    this.taskForm = this.createForm();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    
    // Check if user preferences allow task creation
    if (this.currentUser?.canCreateTasks === false) {
      alert('You have selected "Task Runner" mode. To post errands, please update your preferences to "Task Creator" or "Both" in your profile settings.');
      this.router.navigate(['/profile/preferences']);
      return;
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      area: ['', [Validators.required]],
      priority: ['standard', [Validators.required]],
      dateNeeded: ['', [Validators.required, this.futureDateValidator]],
      budget: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { futureDate: true };
    }
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingService.show();
      
      try {
        // Validate and sanitize form data
        const formData: CreateTaskData = {
          taskDescription: this.sanitizeInput(this.taskForm.value.taskDescription),
          area: this.sanitizeInput(this.taskForm.value.area),
          priority: this.taskForm.value.priority,
          dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
          budget: this.validateBudget(this.taskForm.value.budget),
          notes: this.taskForm.value.notes ? this.sanitizeInput(this.taskForm.value.notes) : undefined,
          termsAccepted: this.taskForm.value.termsAccepted
        };

        // Store task data in session and redirect to payment first
        const taskData = {
          ...formData,
          budget: formData.budget
        };
        
        sessionStorage.setItem('pendingTask', JSON.stringify(taskData));
        
        this.loadingService.hide();
        this.isSubmitting = false;
        
        // Generate temporary task ID for payment
        const tempTaskId = 'TEMP_' + Date.now();
        this.initiatePayment(tempTaskId, taskData.budget);
      } catch (error) {
        this.loadingService.hide();
        this.isSubmitting = false;
        alert('Error processing your request. Please try again.');
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private initiatePayment(tempTaskId: string, budget: number): void {
    // Generate payment URL with temporary task ID
    const paymentUrl = this.generatePayFastUrl(tempTaskId, budget);
    
    // Show message and redirect to payment
    alert(`Budget: R${budget.toFixed(2)}\n\nYou will now be redirected to PayFast to complete payment.\n\nYour task will be posted after successful payment.`);
    
    // Reset form
    this.taskForm.reset({ priority: 'standard' });
    
    // Redirect to PayFast payment page
    window.location.href = paymentUrl;
  }

  private generatePayFastUrl(taskId: string, amount: number): string {
    const sanitizedTaskId = this.sanitizeInput(taskId);
    const paymentData = {
      merchant_id: '10000100',
      merchant_key: '46f0cd694581a',
      amount: amount.toFixed(2),
      item_name: `Task Payment - ${sanitizedTaskId}`,
      item_description: 'DoForYou Task Payment',
      return_url: 'http://localhost:4200/payment-success',
      cancel_url: 'http://localhost:4200/payment-cancelled',
      notify_url: 'http://localhost:5015/api/payfast/notify',
      custom_str1: sanitizedTaskId
    };

    const queryString = Object.entries(paymentData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `https://sandbox.payfast.co.za/eng/process?${queryString}`;
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, '');
  }

  private validateBudget(budget: any): number {
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      throw new Error('Invalid budget amount');
    }
    return numBudget;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check field validity
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  // Helper to get specific error message
  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    
    const errors = field.errors;
    
    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['min']) return 'Budget must be at least R0';
    if (errors['futureDate']) return 'Please select a future date';
    if (errors['requiredTrue']) return 'You must accept the terms and conditions';
    
    return 'Invalid value';
  }
}
```

#### Task Details Component
```typescript
// src/app/features/tasks/task-details/task-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  task: any = null;
  canClaim = false;
  canComplete = false;
  taskId: string = '';

  constructor(
    private route: ActivatedRoute,
    private errandsService: ErrandsService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.params['id'];
    this.loadTaskDetails();
    
    // Check for auto-accept parameter
    const shouldAutoAccept = this.route.snapshot.queryParams['accept'];
    if (shouldAutoAccept === 'true') {
      this.autoAcceptTask();
    }
  }

  private loadTaskDetails() {
    this.errandsService.getTask(this.taskId).subscribe({
      next: (response) => {
        this.task = response.data;
        this.updateActionButtons();
      },
      error: (error) => {
        console.error('Error loading task:', error);
      }
    });
  }

  private autoAcceptTask() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.task) {
      this.errandsService.claimTask(this.taskId, currentUser.name, currentUser.contact).subscribe({
        next: () => {
          this.modalService.showAlert('Success', 'Task accepted successfully! You can now start working on it.', 'success');
          this.loadTaskDetails(); // Refresh task data
        },
        error: (error) => {
          this.modalService.showAlert('Error', 'Failed to accept task. Please try again.', 'error');
        }
      });
    }
  }

  private updateActionButtons() {
    // Update button visibility based on task status
    this.canClaim = this.task?.taskStatus === 'posted';
    this.canComplete = this.task?.taskStatus === 'claimed';
  }

  claimTask() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.modalService.showAlert('Error', 'Please log in to claim tasks', 'error');
      return;
    }

    this.errandsService.claimTask(this.taskId, currentUser.name, currentUser.contact).subscribe({
      next: () => {
        this.modalService.showAlert('Success', 'Task claimed successfully! You can now start working on it.', 'success');
        this.loadTaskDetails(); // Refresh to show updated status
      },
      error: (error) => {
        this.modalService.showAlert('Error', 'Failed to claim task. Please try again.', 'error');
      }
    });
  }

  markComplete() {
    // TODO: Implement mark complete functionality
    this.modalService.showAlert('Info', 'Mark complete functionality coming soon!', 'info');
  }
}
```

### Dashboard Components

#### User Dashboard Component
```typescript
// src/app/features/dashboard/user-dashboard/user-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { UserPreferencesService } from '../../../services/user-preferences.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  stats = { active: 0, completed: 0, pending: 0 };
  runnerStats = { claimed: 0, inProgress: 0, earnings: 0 };
  canCreateTasks = true;
  canAcceptTasks = true;

  constructor(
    private errandsService: ErrandsService,
    private authService: AuthService,
    private userPreferencesService: UserPreferencesService
  ) {}

  ngOnInit() {
    this.loadUserPreferences();
    this.loadUserStats();
  }

  private loadUserPreferences() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreateTasks = user.canCreateTasks ?? true;
      this.canAcceptTasks = user.canAcceptTasks ?? true;
    }
  }

  private loadUserStats() {
    // Load tasks created by user
    this.errandsService.getUserTasks().subscribe({
      next: (response) => {
        const tasks = response.tasks || [];
        this.stats = {
          active: tasks.filter(t => t.taskStatus === 'posted' || t.taskStatus === 'claimed').length,
          completed: tasks.filter(t => t.taskStatus === 'completed').length,
          pending: tasks.filter(t => t.paymentStatus === 'pending').length
        };
      },
      error: () => {
        this.stats = { active: 0, completed: 0, pending: 0 };
      }
    });

    // Load tasks claimed by user (as runner)
    this.loadRunnerStats();
  }

  private loadRunnerStats() {
    // This would need a new API endpoint to get tasks where current user is the runner
    // For now, using available tasks and filtering client-side
    this.errandsService.getVerifiedTasks().subscribe({
      next: (response) => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const runnerTasks = response.tasks.filter(t => t.helperContact === currentUser.contact);
          this.runnerStats = {
            claimed: runnerTasks.filter(t => t.taskStatus === 'claimed').length,
            inProgress: runnerTasks.filter(t => t.taskStatus === 'in_progress').length,
            earnings: 0 // Would calculate from completed tasks
          };
        }
      },
      error: () => {
        this.runnerStats = { claimed: 0, inProgress: 0, earnings: 0 };
      }
    });
  }
}
```

### Payment Components

#### Payment Success Component
```typescript
// src/app/features/payments/payment-success/payment-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  processing = true;

  constructor(
    private router: Router,
    private errandsService: ErrandsService
  ) {}

  ngOnInit() {
    this.createTaskAfterPayment();
  }

  private createTaskAfterPayment() {
    const pendingTaskData = sessionStorage.getItem('pendingTask');
    
    if (pendingTaskData) {
      const taskData = JSON.parse(pendingTaskData);
      
      // Add 10 second timeout
      const timeout = setTimeout(() => {
        this.handleError('Task creation timed out. Please contact support.');
      }, 10000);
      
      this.errandsService.createTask(taskData).subscribe({
        next: (response) => {
          clearTimeout(timeout);
          if (response.success) {
            sessionStorage.removeItem('pendingTask');
            this.processing = false;
          } else {
            this.handleError('Failed to create task after payment');
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          this.handleError('Error creating task after payment');
        }
      });
    } else {
      this.handleError('No pending task data found');
    }
  }

  private handleError(message: string) {
    alert(message + '. Please contact support.');
    this.processing = false;
  }

  goToDashboard() {
    this.router.navigate(['/user-dashboard']);
  }
}
```

### User Management Components

#### Profile Component
```typescript
// src/app/features/user-management/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { UserPreferencesService, UserPreferences, BankDetails } from '../../../services/user-preferences.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile = {
    name: '',
    email: '',
    phone: '',
    username: '',
    idNumber: '',
    address: '',
    dateOfBirth: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountHolderName: ''
  };

  preferences: UserPreferences = {
    canCreateTasks: true,
    canAcceptTasks: false,
    taskCreatorNotifications: true,
    taskRunnerNotifications: true,
    paymentNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  };

  userType: 'creator' | 'runner' = 'creator';
  updating = false;

  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private userPreferencesService: UserPreferencesService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadPreferences();
  }

  private loadUserProfile() {
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.profile) {
          this.profile = {
            name: response.profile.name || '',
            email: response.profile.email || '',
            phone: response.profile.phone || response.profile.contact || '',
            username: response.profile.username || '',
            idNumber: response.profile.idNumber || '',
            address: response.profile.address || '',
            dateOfBirth: response.profile.dateOfBirth || '',
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolderName: ''
          };
        }
      },
      error: (error) => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const user = currentUser as any;
          this.profile = {
            name: user.name || '',
            email: user.email || '',
            phone: user.contact || user.phone || '',
            username: '',
            idNumber: '',
            address: '',
            dateOfBirth: '',
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolderName: ''
          };
        }
      }
    });
  }

  private loadPreferences() {
    this.userPreferencesService.getPreferences().subscribe({
      next: (response: UserPreferences) => {
        this.preferences = response;
        this.userType = response.canCreateTasks ? 'creator' : 'runner';
      },
      error: (error) => {
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
          this.preferences = { ...this.preferences, ...JSON.parse(saved) };
          this.userType = this.preferences.canCreateTasks ? 'creator' : 'runner';
        }
      }
    });
  }

  updateProfile() {
    this.updating = true;
    
    const updateData = {
      name: this.profile.name,
      contact: this.profile.phone,
      username: this.profile.username,
      idNumber: this.profile.idNumber,
      address: this.profile.address,
      dateOfBirth: this.profile.dateOfBirth ? new Date(this.profile.dateOfBirth).toISOString() : null
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          this.modalService.showModal({
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully.'
          });
        }
      },
      error: (error) => {
        this.updating = false;
        this.modalService.showModal({
          type: 'error',
          title: 'Update Failed',
          message: 'An error occurred while updating your profile.'
        });
      }
    });
  }

  onUserTypeChange() {
    this.preferences.canCreateTasks = this.userType === 'creator';
    this.preferences.canAcceptTasks = this.userType === 'runner';
    this.updatePreferences();
  }

  updatePreferences() {
    this.userPreferencesService.updatePreferences(this.preferences).subscribe({
      next: (response) => {
        if (response.success) {
          this.userPreferencesService.saveToLocalStorage(this.preferences);
          this.modalService.showModal({
            type: 'success',
            title: 'Preferences Updated',
            message: 'Your preferences have been updated successfully.'
          });
        }
      },
      error: (error) => {
        this.userPreferencesService.saveToLocalStorage(this.preferences);
        this.modalService.showModal({
          type: 'warning',
          title: 'Preferences Saved Locally',
          message: 'Preferences saved locally. They will sync when connection is restored.'
        });
      }
    });
  }
}
```

### Layout Components

#### Header Component
```typescript
// src/app/layout/header/header.component.ts
import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit, OnInit {
  isMenuCollapsed = false;
  isLoggedIn = false;
  isAdmin = false;
  currentUser: User | null = null;
  private hamburgerAnimation!: GSAPTimeline;
  private hamburgerInitialized = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      this.isAdmin = this.checkIfAdmin(user);
    });
  }

  ngAfterViewInit() {
    this.initializeHamburger();
  }

  initializeHamburger() {
    this.hamburgerAnimation = gsap.timeline({ paused: true });
    
    this.hamburgerAnimation.to(".hamburger-inner", {
      duration: 0.3,
      rotate: 45,
      y: 6,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerAnimation.to(".hamburger-inner:before", {
      duration: 0.3,
      opacity: 0,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerAnimation.to(".hamburger-inner:after", {
      duration: 0.3,
      rotate: -45,
      y: -6,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerInitialized = true;
  }

  postErrand() {
    // Always check authentication first
    if (!this.authService.isAuthenticated()) {
      // Redirect to login with return URL
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/post-errand' } 
      });
      return;
    }
    
    // If authenticated, navigate to post errand page
    this.router.navigate(['/post-errand']);
  }

  private checkIfAdmin(user: User | null): boolean {
    return this.authService.isAdmin();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
```

### Admin Components

#### Admin Dashboard Component
```typescript
// src/app/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminDashboard } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p class="text-muted">Manage your DoForYou platform</p>
      </div>

      <div class="stats-grid" *ngIf="dashboard">
        <!-- Task Stats -->
        <div class="stat-card">
          <div class="stat-icon bg-primary">
            <i class="fas fa-tasks"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.taskStats.totalTasks}}</h3>
            <p>Total Tasks</p>
            <small class="text-success" *ngIf="dashboard.taskStats.pendingVerification > 0">
              {{dashboard.taskStats.pendingVerification}} pending verification
            </small>
          </div>
        </div>

        <!-- User Stats -->
        <div class="stat-card">
          <div class="stat-icon bg-success">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.userStats.totalUsers}}</h3>
            <p>Total Users</p>
            <small class="text-info">{{dashboard.userStats.newUsers}} new this week</small>
          </div>
        </div>

        <!-- Revenue Stats -->
        <div class="stat-card">
          <div class="stat-icon bg-warning">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>R{{dashboard.financialStats.totalRevenue | number:'1.2-2'}}</h3>
            <p>Total Revenue</p>
            <small class="text-warning" *ngIf="dashboard.financialStats.pendingRevenue > 0">
              R{{dashboard.financialStats.pendingRevenue | number:'1.2-2'}} pending
            </small>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="quick-actions">
                <button class="btn btn-primary btn-sm" routerLink="/admin/tasks" 
                        [queryParams]="{paymentStatus: 'pending'}">
                  <i class="fas fa-check-circle"></i>
                  Verify Payments ({{dashboard?.taskStats?.pendingVerification || 0}})
                </button>
                <button class="btn btn-success btn-sm" routerLink="/admin/users" 
                        [queryParams]="{isVerified: false}">
                  <i class="fas fa-user-check"></i>
                  Verify Users
                </button>
                <button class="btn btn-warning btn-sm" routerLink="/admin/tasks" 
                        [queryParams]="{priority: 'urgent'}">
                  <i class="fas fa-bolt"></i>
                  Urgent Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.adminService.getDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboard = response.data;
        } else {
          this.error = 'Failed to load dashboard';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load dashboard';
        this.loading = false;
      }
    });
  }
}
```

## Future Enhancements

### Planned Features
- Progressive Web App (PWA)
- Offline functionality
- Push notifications
- Advanced task automation
- Machine learning recommendations

### Technical Improvements
- State management with NgRx
- Micro-frontend architecture
- Enhanced testing coverage
- Performance monitoring tools

---

*This documentation reflects the current state of the DoForYou frontend implementation as of the latest reorganization to feature-based architecture.*