# DoForYou - Complete Production Implementation Guide

## 🚀 IMPLEMENTATION ROADMAP

This guide will take your system from 40% to 100% production-ready in 5 phases.

---

## PHASE 1: DATABASE SETUP (30 minutes)

### Step 1: Run Migration
```bash
# Connect to your PostgreSQL database
psql -U your_username -d doforyou_db -f database-migration-v2.sql

# Verify tables created
psql -U your_username -d doforyou_db -c "\dt"
```

### Step 2: Verify Migration
```sql
-- Check new columns in tasks table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('commission_amount', 'escrow_status', 'payout_amount');

-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('escrow_transactions', 'wallet_transactions', 'chat_messages');
```

---

## PHASE 2: BACKEND IMPLEMENTATION (4-6 hours)

### Step 1: Install Required Packages
```bash
cd DoForYou-API

# Add SignalR
dotnet add package Microsoft.AspNetCore.SignalR

# Add Background Services
dotnet add package Microsoft.Extensions.Hosting

# Add Redis (for distributed caching)
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis

# Add Health Checks
dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks
dotnet add package AspNetCore.HealthChecks.Npgsql
```

### Step 2: Update appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=doforyou_db;Username=postgres;Password=your_password",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "Key": "YOUR_SUPER_SECRET_KEY_MINIMUM_32_CHARACTERS_LONG",
    "Issuer": "DoForYou",
    "Audience": "DoForYou",
    "ExpiryMinutes": 10080
  },
  "PayFast": {
    "MerchantId": "10000100",
    "MerchantKey": "46f0cd694581a",
    "Passphrase": "DoForYouEscrow2024",
    "Environment": "Test",
    "CommissionPercentage": 15.00,
    "EscrowHoldPeriodHours": 48,
    "AutoReleaseEnabled": true,
    "ProcessUrl": "https://sandbox.payfast.co.za/eng/process",
    "ReturnUrl": "http://localhost:4200/tasks/payment-success",
    "CancelUrl": "http://localhost:4200/tasks/payment-cancel",
    "NotifyUrl": "http://localhost:5001/api/v1/payment/notify",
    "EscrowNotifyUrl": "http://localhost:5001/api/v1/payment/escrow-notify"
  },
  "Features": {
    "EnableRealTime": true,
    "EnableBackgroundJobs": true,
    "EnableEscrow": true,
    "EnableWallet": true
  }
}
```

### Step 3: Create New Models

Create `Models/EscrowTransaction.cs`:
```csharp
public class EscrowTransaction
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string? PayFastPaymentId { get; set; }
    public string? PayFastTransactionId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal PayoutAmount { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime? PaymentReceivedAt { get; set; }
    public DateTime? EscrowHeldAt { get; set; }
    public DateTime? ScheduledReleaseAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public string? PayFastSignature { get; set; }
    public bool IpnValidated { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public Task Task { get; set; } = null!;
}
```

Create `Models/WalletTransaction.cs`:
```csharp
public class WalletTransaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? TaskId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Description { get; set; }
    public string? Reference { get; set; }
    public string Status { get; set; } = "pending";
    public string? PaymentMethod { get; set; }
    public string? PaymentDetails { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public Task? Task { get; set; }
}
```

### Step 4: Update ApplicationDbContext
```csharp
public class ApplicationDbContext : DbContext
{
    // Existing DbSets...
    
    // NEW DbSets
    public DbSet<EscrowTransaction> EscrowTransactions { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<UserDevice> UserDevices { get; set; }
    public DbSet<FraudCheck> FraudChecks { get; set; }
}
```

### Step 5: Create Services

See separate files:
- `Services/EscrowService.cs` (provided separately)
- `Services/WalletService.cs` (provided separately)
- `Services/Background/EscrowReleaseService.cs` (provided separately)
- `Hubs/ChatHub.cs` (provided separately)

### Step 6: Update Program.cs
```csharp
// Add services
builder.Services.AddScoped<IEscrowService, EscrowService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddHostedService<EscrowReleaseService>();

// Add SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

// Add Redis caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

// After app.Build()
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");
```

---

## PHASE 3: FRONTEND IMPLEMENTATION (3-4 hours)

### Step 1: Install Dependencies
```bash
cd DoForYou

# Install SignalR client
npm install @microsoft/signalr

# Install date utilities
npm install date-fns

# Install chart library (for analytics)
npm install chart.js ng2-charts
```

### Step 2: Update Environment Files

`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api/v1',
  hubUrl: 'http://localhost:5001/hubs',
  payfast: {
    merchantId: '10000100',
    merchantKey: '46f0cd694581a'
  },
  features: {
    enableRealtime: true,
    enableWallet: true,
    enableEscrow: true
  }
};
```

### Step 3: Create Components

Generate components:
```bash
# Wallet components
ng generate component features/wallet/wallet-dashboard
ng generate component features/wallet/transaction-history
ng generate component features/wallet/withdrawal-request

# Chat components
ng generate component features/chat/chat-window
ng generate component features/chat/message-list

# Escrow components
ng generate component features/tasks/escrow-status
ng generate component features/tasks/commission-breakdown
```

### Step 4: Update Task Service

Add to `src/app/services/task.service.ts`:
```typescript
// Calculate commission
calculateCommission(amount: number): { commission: number; payout: number } {
  const commission = Math.max(amount * 0.15, 5);
  const payout = amount - commission;
  return { commission, payout };
}

// Get escrow status
getEscrowStatus(taskId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/payment/${taskId}/escrow-status`);
}
```

### Step 5: Initialize Real-time Service

Update `app.component.ts`:
```typescript
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private realtimeService: RealtimeService
  ) {}

  ngOnInit() {
    // Connect to SignalR when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        const token = localStorage.getItem('token');
        if (token) {
          this.realtimeService.connect(token);
        }
      } else {
        this.realtimeService.disconnect();
      }
    });
  }
}
```

---

## PHASE 4: TESTING (2-3 hours)

### Backend Tests

Create `Tests/EscrowServiceTests.cs`:
```csharp
[TestFixture]
public class EscrowServiceTests
{
    [Test]
    public void CalculateCommission_ShouldReturn15Percent()
    {
        // Arrange
        var service = new EscrowService();
        
        // Act
        var result = service.CalculateCommission(500);
        
        // Assert
        Assert.AreEqual(75, result); // 15% of 500
    }
    
    [Test]
    public void CalculateCommission_ShouldReturnMinimum5()
    {
        // Arrange
        var service = new EscrowService();
        
        // Act
        var result = service.CalculateCommission(20);
        
        // Assert
        Assert.AreEqual(5, result); // Minimum R5
    }
}
```

### Frontend Tests

Create `src/app/services/wallet.service.spec.ts`:
```typescript
describe('WalletService', () => {
  it('should calculate commission correctly', () => {
    const service = new WalletService(null as any);
    const result = service.calculateCommission(500);
    expect(result.commission).toBe(75);
    expect(result.payout).toBe(425);
  });
});
```

### Integration Tests

Test complete flow:
```bash
# 1. Create task with R500 budget
# 2. Verify commission = R75, payout = R425
# 3. Complete payment via PayFast
# 4. Verify escrow status = 'held'
# 5. Complete task
# 6. Verify 48-hour hold period set
# 7. Wait or manually trigger release
# 8. Verify runner receives R425
# 9. Verify platform receives R75
```

---

## PHASE 5: DEPLOYMENT (1-2 hours)

### Step 1: Update Production Config

`appsettings.Production.json`:
```json
{
  "PayFast": {
    "Environment": "Production",
    "MerchantId": "YOUR_LIVE_MERCHANT_ID",
    "MerchantKey": "YOUR_LIVE_MERCHANT_KEY",
    "ProcessUrl": "https://www.payfast.co.za/eng/process"
  }
}
```

### Step 2: Deploy Backend
```bash
# Build
dotnet publish -c Release -o ./publish

# Deploy to Azure/AWS/Railway
# (Use your preferred deployment method)
```

### Step 3: Deploy Frontend
```bash
# Build for production
ng build --configuration production

# Deploy to Vercel/Netlify
# (Use your preferred deployment method)
```

---

## VERIFICATION CHECKLIST

### Database ✓
- [ ] All tables created
- [ ] Indexes created
- [ ] Triggers working
- [ ] Business rules inserted

### Backend ✓
- [ ] Escrow service working
- [ ] Wallet service working
- [ ] Background service running
- [ ] SignalR hub connected
- [ ] Health checks passing

### Frontend ✓
- [ ] Wallet dashboard showing
- [ ] Commission breakdown visible
- [ ] Real-time chat working
- [ ] Notifications appearing

### Integration ✓
- [ ] Task creation with commission
- [ ] PayFast payment flow
- [ ] Escrow hold working
- [ ] Auto-release after 48h
- [ ] Wallet balance updating

---

## MONITORING

### Key Metrics to Track
```sql
-- Daily revenue
SELECT 
    DATE(released_at) as date,
    SUM(commission_amount) as daily_commission,
    COUNT(*) as tasks_completed
FROM escrow_transactions
WHERE status = 'released'
GROUP BY DATE(released_at)
ORDER BY date DESC;

-- Pending escrows
SELECT COUNT(*), SUM(total_amount)
FROM escrow_transactions
WHERE status = 'held';

-- Wallet balances
SELECT SUM(wallet_balance) as total_user_balance
FROM users;
```

---

## TROUBLESHOOTING

### Issue: Escrow not releasing after 48 hours
**Solution**: Check background service is running
```bash
# Check logs
tail -f /var/log/doforyou/escrow-release.log

# Manually trigger release
curl -X POST http://localhost:5001/api/v1/payment/auto-release-expired \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Issue: SignalR not connecting
**Solution**: Check CORS and WebSocket support
```csharp
// In Program.cs
app.UseCors(policy => policy
    .WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

### Issue: Commission calculation wrong
**Solution**: Verify trigger is working
```sql
-- Test trigger
INSERT INTO tasks (task_description, budget, ...) 
VALUES ('Test', 500, ...);

-- Check commission
SELECT budget, commission_amount, payout_amount 
FROM tasks 
WHERE task_description = 'Test';
```

---

## NEXT STEPS

1. **Week 1**: Implement all Phase 1-2 (Database + Backend)
2. **Week 2**: Implement Phase 3 (Frontend)
3. **Week 3**: Testing and bug fixes
4. **Week 4**: Production deployment

---

## SUPPORT

For issues during implementation:
1. Check logs: `tail -f /var/log/doforyou/*.log`
2. Review database: `psql -d doforyou_db`
3. Test endpoints: Use Postman/Swagger
4. Check SignalR: Browser DevTools → Network → WS

---

## SUCCESS CRITERIA

Your system is production-ready when:
- ✅ All tests passing
- ✅ Escrow auto-release working
- ✅ Real-time chat functional
- ✅ Wallet transactions accurate
- ✅ Commission calculated correctly
- ✅ Health checks green
- ✅ No critical security issues

**Estimated Total Time: 12-16 hours**
**Current Progress: 40% → Target: 100%**
