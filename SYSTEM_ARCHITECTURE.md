# DoForYou System Architecture & Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [Authentication & Authorization](#authentication--authorization)
6. [Task Lifecycle](#task-lifecycle)
7. [Payment Processing](#payment-processing)
8. [Real-Time Features](#real-time-features)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)

---

## System Overview

DoForYou is a task marketplace platform connecting task creators with task runners. The system uses a modern web architecture with Angular frontend and .NET backend.

### Technology Stack

**Frontend:**
- Angular 19.2.14
- TypeScript
- RxJS for reactive programming
- Bootstrap 5 + Custom SCSS
- SignalR Client for real-time communication

**Backend:**
- .NET 8 Web API
- PostgreSQL Database
- Entity Framework Core
- JWT Authentication
- BCrypt for password hashing
- SignalR for real-time features

**Infrastructure:**
- CORS-enabled API
- RESTful architecture
- Escrow payment system
- Background job processing

---

## Frontend Architecture

### Service Layer

#### 1. AuthService (`auth.service.ts`)

**Purpose:** Manages user authentication, authorization, and profile state.

**Key Features:**
- JWT token management
- User session persistence
- Role-based access control
- Profile completion tracking

**Core Methods:**

```typescript
// Authentication
login(loginData: LoginModel): Observable<AuthResponse>
register(registerData: RegisterModel): Observable<AuthResponse>
logout(): void
isAuthenticated(): boolean

// Authorization
isAdmin(): boolean
canPostErrands(): boolean
canAcceptTasks(): boolean
canCreateTasks(): boolean
canClaimTasks(): boolean

// Profile Management
getCurrentUser(): User | null
isProfileComplete(): boolean
updateProfile(profileData: any): Observable<any>
getProfile(): Observable<any>
```

**State Management:**
- Uses BehaviorSubject for reactive user state
- Stores token and user data in localStorage
- Automatically loads user on service initialization

**Business Rules:**
- Admins cannot post or accept tasks
- User type determines task permissions:
  - `creator`: Can only create tasks
  - `runner`: Can only accept tasks
  - `both`: Can create and accept tasks

#### 2. ErrandsService (`errands.service.ts`)

**Purpose:** Handles all task-related operations.

**Key Features:**
- Task CRUD operations
- Pagination and filtering
- Response caching (30-second duration)
- Task normalization for backward compatibility

**Core Methods:**

```typescript
// Task Management
createTask(taskData: CreateTaskData): Observable<CreateTaskResponse>
getVerifiedTasks(page, pageSize, filters): Observable<PaginatedResponse>
getUserTasks(): Observable<PaginatedResponse>
getTask(taskId: string): Observable<any>
updateTask(taskId: string, taskData): Observable<any>

// Task Actions
claimTask(taskId, helperName, helperContact): Observable<any>

// Payment
generatePaymentUrl(taskId: string): Observable<any>
handlePaymentSuccess(): Observable<any>
updateTaskPaymentStatus(taskId, status): Observable<any>

// Utilities
getFilterOptions(): Observable<any>
clearCache(): void
```

**Caching Strategy:**
- Caches GET requests for 30 seconds
- Clears cache on mutations (create, update, claim)
- Cache key generation based on endpoint + parameters

**Task Normalization:**
Converts backend response to standardized format:
```typescript
interface Errand {
  id: number
  taskId: string
  userName: string
  userContact: string
  taskDescription: string
  area: string
  budget: number
  paymentStatus: string  // "Pending", "Completed", "EscrowHeld"
  taskStatus: string      // "PendingPayment", "Posted", "Claimed", "Completed"
  priority: string
  createdAt: string
}
```

#### 3. TaskService (`task.service.ts`)

**Purpose:** Advanced task operations and real-time updates.

**Key Features:**
- Task detail management
- Progress tracking
- Task communication
- Dashboard statistics

**Core Methods:**

```typescript
// Task Details
getTaskDetail(taskId: string): Observable<ApiResponse<TaskDetail>>

// Progress Management
addProgressUpdate(taskId, message): Observable<ApiResponse<boolean>>
getProgressUpdates(taskId): Observable<ApiResponse<ProgressUpdate[]>>

// Task Status
completeTask(taskId: string): Observable<ApiResponse<boolean>>
confirmTask(taskId: string): Observable<ApiResponse<boolean>>
cancelTask(taskId, reason): Observable<ApiResponse<boolean>>

// Communication
sendTaskMessage(taskId, message): Observable<ApiResponse<boolean>>
getTaskMessages(taskId): Observable<ApiResponse<TaskMessage[]>>
markMessagesAsRead(taskId): Observable<ApiResponse<boolean>>

// Dashboard
getMyActiveTasks(): Observable<ApiResponse<TaskDetail[]>>
getMyPostedTasks(): Observable<ApiResponse<any>>
getDashboardStats(): Observable<ApiResponse<any>>

// Real-time
subscribeToTaskUpdates(taskId: string): void
```

**Real-Time Updates:**
- Polls task details every 30 seconds
- Emits updates via BehaviorSubject
- Components subscribe to `taskUpdates$` observable

**Utility Methods:**
```typescript
formatCurrency(amount: number): string
calculateCommission(amount: number): number  // 15%
calculateRunnerEarning(amount: number): number
getTaskStatusColor(status: string): string
getTaskPriorityColor(priority: string): string
```

#### 4. PaymentService (`payment.service.ts`)

**Purpose:** Handles payment processing and wallet management.

**Key Features:**
- PayFast integration
- Wallet operations
- Commission calculations

**Core Methods:**

```typescript
// Payment
initiatePayment(request: PaymentRequest): Observable<ApiResponse<PaymentResponse>>

// Wallet
getWallet(): Observable<ApiResponse<WalletData>>
withdrawFunds(request: WithdrawRequest): Observable<ApiResponse<WithdrawResponse>>

// Calculations
calculateCommission(amount: number): { platformFee: number; runnerAmount: number }
```

**Commission Structure:**
- Platform fee: 15% of task budget
- Runner receives: 85% of task budget

### Component Architecture

**Key Components:**
- `task-create`: Task creation wizard
- `task-list`: Paginated task browser
- `admin-dashboard`: Admin panel
- `wallet`: Wallet management
- `header`: Navigation with auth state
- `footer`: Site footer

**Routing:**
- Public routes: Home, About, Contact, Login, Register
- Protected routes: Dashboard, Create Task, My Tasks
- Admin routes: Admin Dashboard, User Management, Task Management

---

## Backend Architecture

### Core Components

#### 1. Program.cs - Application Bootstrap

**Services Registered:**
```csharp
// Database
AddDbContext<AppDbContext>(PostgreSQL)

// Business Services
AddScoped<IRulesEngine, RulesEngine>()
AddScoped<IEscrowService, EscrowService>()
AddScoped<IWalletService, WalletService>()
AddScoped<INotificationService, NotificationService>()
AddScoped<IBankingService, BankingService>()

// Background Services
AddHostedService<EscrowReleaseService>()

// Real-time
AddSignalR()

// Authentication
AddAuthentication(JwtBearer)
```

**Middleware Pipeline:**
```
CORS → ErrorHandling → Authentication → Authorization → Controllers
```

**CORS Configuration:**
- Allows: `http://localhost:4200`
- Methods: All
- Headers: All
- Credentials: Enabled

#### 2. AuthController - Authentication

**Endpoints:**

**POST /api/v1/auth/register**
```csharp
Input: RegisterRequest {
  firstName, lastName, email, password,
  phoneNumber, userType, idNumber, address,
  dateOfBirth, username
}

Process:
1. Check email uniqueness
2. Hash password with BCrypt
3. Create user with default settings:
   - IsVerified: true
   - ProfileCompleted: true
   - Roles: "User"
4. Generate JWT token
5. Return user + token

Output: AuthResponse {
  success, token, user, message
}
```

**POST /api/v1/auth/login**
```csharp
Input: LoginRequest { email, password }

Process:
1. Clean email (remove mailto: prefix)
2. Find user by email
3. Verify password with BCrypt
4. Update LastLoginAt timestamp
5. Generate JWT token with claims:
   - NameIdentifier: userId
   - Email: user email
   - Role: user roles (comma-separated)
6. Return user + token

Output: AuthResponse {
  success, token, user, message
}
```

**JWT Token Configuration:**
- Algorithm: HMAC-SHA256
- Expiry: 7 days
- Issuer: "DoForYou"
- Audience: "DoForYou"

#### 3. TasksController - Task Management

**Key Endpoints:**

**POST /api/v1/tasks** (Create Task)
```csharp
Authorization: Required
Input: CreateTaskRequest {
  taskDescription, category, area,
  dateNeeded, budget, notes, priority
}

Process:
1. Validate user permissions via RulesEngine
2. Generate unique task ID: DFY-{timestamp}-{random}
3. Calculate commission (15%) and payout (85%)
4. Create task with status:
   - PaymentStatus: "Pending"
   - TaskStatus: "PendingPayment"
   - EscrowStatus: "pending"
5. Validate task via RulesEngine
6. Generate PayFast payment URL
7. Save to database

Output: {
  success, data: { task, paymentUrl }, message
}
```

**GET /api/v1/tasks/available** (Browse Tasks)
```csharp
Authorization: Not required
Query: page, pageSize, search, category

Process:
1. Filter tasks:
   - PaymentStatus: "EscrowHeld" OR "Completed"
   - TaskStatus: "Posted"
2. Apply search (description, area)
3. Apply category filter
4. Paginate results
5. Include creator info

Output: PaginatedResponse {
  success, count, page, pageSize,
  totalPages, tasks[]
}
```

**POST /api/v1/tasks/{taskId}/claim** (Claim Task)
```csharp
Authorization: Required
Input: ClaimTaskRequest { helperName, helperContact }

Process:
1. Validate task availability:
   - Task exists
   - Not own task
   - Status: "Posted"
2. Update task:
   - AcceptedByUserId: current user
   - TaskStatus: "Claimed"
   - HelperName, HelperContact
3. Send notification to creator
4. Save changes

Output: { success, data: true, message }
```

**POST /api/v1/tasks/{taskId}/complete** (Complete Task)
```csharp
Authorization: Required

Process:
1. Validate:
   - User is task runner
   - Status: "Claimed"
2. Update task:
   - TaskStatus: "Completed"
   - CompletedAt: now
   - EscrowHoldUntil: now + 48 hours
3. Send notification to creator
4. Save changes

Output: { success, data: true, message }
```

**POST /api/v1/tasks/{taskId}/confirm** (Confirm & Release Payment)
```csharp
Authorization: Required

Process:
1. Validate:
   - User is task creator
   - Status: "Completed"
2. Update task:
   - TaskStatus: "RunnerPaid"
   - EscrowStatus: "none"
   - PaidToRunnerAt: now
3. Create wallet transaction:
   - Amount: payoutAmount (85% of budget)
   - Type: "credit"
   - Status: "completed"
4. Update runner wallet balance
5. Send notification to runner
6. Save changes

Output: { success, data: true, message }
```

**GET /api/v1/tasks/dashboard/stats** (Dashboard Statistics)
```csharp
Authorization: Required

Returns:
{
  // Creator Stats
  postedTasks, pendingPayment, activeTasks,
  awaitingConfirmation, completedTasks,
  totalSpent, thisMonthSpending, averageTaskCost,
  
  // Runner Stats
  availableTasks, myActiveTasks, runnerCompletedTasks,
  totalEarnings, availableBalance, pendingPayouts,
  thisMonthEarnings, completionRate, averageEarning,
  
  // Shared
  myRating
}
```

#### 4. Business Services

**EscrowService**
```csharp
// Calculate 15% platform commission
decimal CalculateCommission(decimal amount)

// Hold payment in escrow
Task HoldPaymentAsync(int taskId, decimal amount)

// Release payment to runner after confirmation
Task ReleasePaymentAsync(int taskId)

// Auto-release after 48 hours if no disputes
Task AutoReleaseExpiredEscrowsAsync()
```

**WalletService**
```csharp
// Get user wallet balance
Task<decimal> GetBalanceAsync(int userId)

// Add funds to wallet
Task CreditWalletAsync(int userId, decimal amount, string description)

// Deduct funds from wallet
Task DebitWalletAsync(int userId, decimal amount, string description)

// Get transaction history
Task<List<WalletTransaction>> GetTransactionsAsync(int userId)
```

**NotificationService**
```csharp
// Notify when task is claimed
Task NotifyTaskClaimedAsync(int userId, string taskDescription, string runnerName)

// Notify when task is completed
Task NotifyTaskCompletedAsync(int userId, string taskDescription, string runnerName)

// Notify when payment is released
Task NotifyPaymentReleasedAsync(int userId, string taskDescription, decimal amount)
```

**RulesEngine**
```csharp
// Validate user can perform action
Task<bool> CanPerformActionAsync(string entity, string action, RuleContext context)

// Validate entity against rules
Task<RuleValidationResult> ValidateEntityAsync(object entity, RuleContext context)

// Get validation results
Task<List<RuleValidationResult>> ValidateAsync(string entity, string ruleType, RuleContext context)
```

**EscrowReleaseService (Background)**
```csharp
// Runs every hour
// Auto-releases escrow payments after 48 hours
// Updates task status to "RunnerPaid"
// Credits runner wallet
```

---

## Data Flow

### 1. User Registration Flow

```
Frontend                    Backend                     Database
   |                          |                            |
   |-- POST /auth/register -->|                            |
   |                          |-- Check email exists ----->|
   |                          |<-- Email available --------|
   |                          |-- Hash password            |
   |                          |-- Create user ------------->|
   |                          |<-- User created ------------|
   |                          |-- Generate JWT token       |
   |<-- Token + User data ----|                            |
   |-- Store in localStorage  |                            |
   |-- Navigate to dashboard  |                            |
```

### 2. Task Creation Flow

```
Frontend                    Backend                     Database
   |                          |                            |
   |-- POST /tasks ---------->|                            |
   |                          |-- Validate user perms ---->|
   |                          |<-- User can create --------|
   |                          |-- Generate task ID         |
   |                          |-- Calculate commission     |
   |                          |-- Create task ------------->|
   |                          |<-- Task created ------------|
   |                          |-- Generate PayFast URL     |
   |<-- Task + Payment URL ---|                            |
   |-- Redirect to PayFast    |                            |
   |                          |                            |
   |-- User pays on PayFast   |                            |
   |                          |<-- PayFast IPN ------------|
   |                          |-- Update payment status -->|
   |                          |-- Update task status ------>|
   |                          |   (Posted, EscrowHeld)     |
```

### 3. Task Claiming Flow

```
Frontend                    Backend                     Database
   |                          |                            |
   |-- GET /tasks/available ->|                            |
   |                          |-- Query posted tasks ------>|
   |<-- Available tasks ------|<-- Tasks returned ---------|
   |                          |                            |
   |-- POST /tasks/{id}/claim>|                            |
   |                          |-- Validate availability -->|
   |                          |-- Update task ------------->|
   |                          |   (Status: Claimed)        |
   |                          |-- Send notification ------->|
   |<-- Success message ------|                            |
```

### 4. Task Completion & Payment Flow

```
Frontend                    Backend                     Database
   |                          |                            |
   |-- POST /tasks/{id}/complete>|                         |
   |                          |-- Validate runner -------->|
   |                          |-- Update task ------------->|
   |                          |   (Status: Completed)      |
   |                          |   (EscrowHold: 48hrs)      |
   |<-- Success --------------|                            |
   |                          |                            |
   |-- Creator confirms       |                            |
   |-- POST /tasks/{id}/confirm>|                          |
   |                          |-- Validate creator ------->|
   |                          |-- Create wallet txn ------->|
   |                          |-- Update runner balance --->|
   |                          |-- Update task status ------>|
   |                          |   (Status: RunnerPaid)     |
   |                          |-- Send notification ------->|
   |<-- Payment released -----|                            |
```

---

## Authentication & Authorization

### JWT Token Structure

**Claims:**
```json
{
  "nameid": "123",           // User ID
  "email": "user@example.com",
  "role": "User",            // Can be "User" or "Admin"
  "exp": 1234567890,         // Expiration timestamp
  "iss": "DoForYou",
  "aud": "DoForYou"
}
```

### Authorization Levels

**Public Endpoints:**
- GET /api/v1/tasks/available
- GET /api/v1/categories
- GET /api/v1/tasks/filters
- POST /api/v1/auth/register
- POST /api/v1/auth/login

**Authenticated Endpoints:**
- All other endpoints require `[Authorize]` attribute
- Token must be in header: `Authorization: Bearer {token}`

**Admin Endpoints:**
- Require `[Authorize(Roles = "Admin")]`
- /api/v1/admin/*

### Frontend Auth Guards

**AuthGuard:**
- Checks if user is authenticated
- Redirects to login if not

**AdminGuard:**
- Checks if user has admin role
- Redirects to home if not admin

**ProfileCompletionGuard:**
- Checks if profile is complete
- Redirects to profile completion if not

### Permission System

**User Types:**
- `creator`: Can only create tasks
- `runner`: Can only accept tasks
- `both`: Can create and accept tasks

**Business Rules:**
- Admins cannot create or accept tasks
- Users cannot claim their own tasks
- Only task creator can confirm completion
- Only task runner can mark as complete

---

## Task Lifecycle

### Status Flow

```
PendingPayment → Posted → Claimed → Completed → RunnerPaid
```

### Detailed States

**1. PendingPayment**
- Initial state after task creation
- Payment not yet completed
- Task not visible to runners
- Creator can edit or delete
- Transitions to: Posted (after payment)

**2. Posted**
- Payment completed and held in escrow
- Visible to all runners
- Can be claimed by any runner
- Creator cannot edit
- Transitions to: Claimed (when runner accepts)

**3. Claimed**
- Runner has accepted the task
- Not visible to other runners
- Runner can add progress updates
- Creator and runner can communicate
- Transitions to: Completed (when runner finishes)

**4. Completed**
- Runner has marked task as complete
- Awaiting creator confirmation
- 48-hour escrow hold period starts
- Creator can confirm or dispute
- Transitions to: RunnerPaid (after confirmation)

**5. RunnerPaid**
- Final state
- Payment released to runner
- Task archived
- No further actions possible

### Payment Status

**Pending:**
- Initial state
- Awaiting PayFast payment

**EscrowHeld:**
- Payment received and held
- Released after task completion + confirmation

**Completed:**
- Payment fully processed
- Funds distributed

### Escrow Status

**pending:**
- No escrow yet

**held:**
- Funds held in escrow
- Awaiting task completion

**none:**
- No active escrow
- Payment released or not applicable

---

## Payment Processing

### PayFast Integration

**Configuration:**
```csharp
MerchantId: "10000100"        // Sandbox
MerchantKey: "46f0cd694581a"  // Sandbox
ReturnUrl: "http://localhost:4200/tasks/payment-success"
CancelUrl: "http://localhost:4200/tasks/payment-cancel"
NotifyUrl: "http://localhost:5001/api/v1/payment/notify"
```

### Payment Flow

**1. Initiate Payment**
```
Frontend creates task
Backend generates PayFast URL with parameters:
- merchant_id, merchant_key
- amount (task budget)
- item_name (task description)
- m_payment_id (task ID)
- return_url, cancel_url, notify_url
- User details (name, email)
```

**2. User Payment**
```
User redirected to PayFast
User completes payment
PayFast sends IPN to notify_url
```

**3. Payment Notification (IPN)**
```
Backend receives PayFast IPN
Validates payment signature
Updates task:
- PaymentStatus: "EscrowHeld"
- TaskStatus: "Posted"
- EscrowStatus: "held"
Task now visible to runners
```

**4. Escrow Hold**
```
Payment held until task completion
48-hour hold period after completion
Auto-release if no disputes
```

**5. Payment Release**
```
Creator confirms task completion
Backend:
- Creates wallet transaction
- Credits runner wallet (85% of budget)
- Updates task status to "RunnerPaid"
- Sends notification to runner
```

### Commission Structure

```
Task Budget: R100
Platform Fee (15%): R15
Runner Payout (85%): R85
```

**Calculation:**
```csharp
decimal commission = budget * 0.15m;
decimal payout = budget - commission;
```

---

## Real-Time Features

### SignalR Hub

**ChatHub:**
```csharp
// Hub endpoint: /api/v1/hubs/chat

Methods:
- SendMessage(taskId, message)
- JoinTaskRoom(taskId)
- LeaveTaskRoom(taskId)

Events:
- ReceiveMessage(taskId, userId, message, timestamp)
- TaskUpdated(taskId, status)
- NotificationReceived(notification)
```

### Frontend Integration

```typescript
// Connect to hub
connection = new HubConnectionBuilder()
  .withUrl('http://localhost:5001/api/v1/hubs/chat')
  .build();

// Join task room
connection.invoke('JoinTaskRoom', taskId);

// Listen for messages
connection.on('ReceiveMessage', (data) => {
  // Handle new message
});

// Send message
connection.invoke('SendMessage', taskId, message);
```

### Polling Fallback

For non-real-time updates:
```typescript
// Poll every 30 seconds
setInterval(() => {
  this.taskService.getTaskDetail(taskId).subscribe(task => {
    // Update UI
  });
}, 30000);
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | No | Register new user |
| POST | /api/v1/auth/login | No | Login user |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/tasks | Yes | Create task |
| GET | /api/v1/tasks/available | No | Browse available tasks |
| GET | /api/v1/tasks | Yes | Get user's tasks |
| GET | /api/v1/tasks/{id} | Yes | Get task details |
| PUT | /api/v1/tasks/{id} | Yes | Update task |
| POST | /api/v1/tasks/{id}/claim | Yes | Claim task |
| POST | /api/v1/tasks/{id}/complete | Yes | Complete task |
| POST | /api/v1/tasks/{id}/confirm | Yes | Confirm & release payment |
| GET | /api/v1/tasks/my-posted | Yes | Get posted tasks |
| GET | /api/v1/tasks/my-active | Yes | Get active tasks |
| GET | /api/v1/tasks/pending-payment | Yes | Get pending payment tasks |
| GET | /api/v1/tasks/filters | No | Get filter options |
| GET | /api/v1/tasks/{id}/payment-url | Yes | Get payment URL |
| POST | /api/v1/tasks/payment-success | Yes | Handle payment success |
| GET | /api/v1/tasks/dashboard/stats | Yes | Get dashboard stats |
| GET | /api/v1/tasks/dashboard/activity | Yes | Get recent activity |
| GET | /api/v1/tasks/payment-history | Yes | Get payment history |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/categories | No | Get all categories |

### Payment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/payment/initiate | Yes | Initiate payment |
| POST | /api/v1/payment/notify | No | PayFast IPN webhook |
| GET | /api/v1/payment/return | No | PayFast return URL |
| GET | /api/v1/payment/cancel | No | PayFast cancel URL |

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/payment/wallet | Yes | Get wallet balance |
| POST | /api/v1/payment/withdraw | Yes | Withdraw funds |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/admin/tasks | Admin | Get all tasks |
| POST | /api/v1/admin/tasks/{id}/verify | Admin | Verify payment |
| POST | /api/v1/admin/tasks/{id}/unverify | Admin | Unverify payment |

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  user_type VARCHAR(20),  -- 'creator', 'runner', 'both'
  id_number VARCHAR(50),
  address TEXT,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  roles VARCHAR(50) DEFAULT 'User',
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  date_of_birth DATE,
  username VARCHAR(100),
  wallet_balance DECIMAL(10,2) DEFAULT 0
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) UNIQUE NOT NULL,
  task_description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  date_needed TIMESTAMP NOT NULL,
  budget DECIMAL(10,2) NOT NULL CHECK (budget >= 50 AND budget <= 10000),
  notes TEXT,
  payment_status VARCHAR(20) DEFAULT 'Pending',
  task_status VARCHAR(20) DEFAULT 'PendingPayment',
  priority VARCHAR(20) DEFAULT 'Standard',
  created_by_user_id INTEGER REFERENCES users(id),
  accepted_by_user_id INTEGER REFERENCES users(id),
  helper_name VARCHAR(200),
  helper_contact VARCHAR(100),
  helper_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  paid_to_runner_at TIMESTAMP,
  commission_amount DECIMAL(10,2),
  payout_amount DECIMAL(10,2),
  escrow_status VARCHAR(20) DEFAULT 'pending',
  escrow_hold_until TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### WalletTransactions Table
```sql
CREATE TABLE wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,  -- 'credit', 'debit'
  status VARCHAR(20) NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TaskProgressUpdates Table
```sql
CREATE TABLE task_progress_updates (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TaskMessages Table
```sql
CREATE TABLE task_messages (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### BusinessRules Table
```sql
CREATE TABLE business_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  condition JSONB NOT NULL,
  action VARCHAR(50) NOT NULL,
  error_message TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Features Summary

### Security
- JWT authentication with 7-day expiry
- BCrypt password hashing
- CORS protection
- Role-based authorization
- Input validation

### Business Logic
- 15% platform commission
- 48-hour escrow hold
- Auto-release after hold period
- User type permissions
- Task status workflow

### Performance
- Response caching (30s)
- Pagination support
- Database indexing
- Connection pooling

### User Experience
- Real-time updates via SignalR
- Progress tracking
- In-task messaging
- Dashboard statistics
- Payment history

### Reliability
- Error handling middleware
- Transaction management
- Background job processing
- Automatic escrow release
- Notification system

---

**Last Updated:** 2024
**Version:** 1.0
**Authors:** DoForYou Development Team
