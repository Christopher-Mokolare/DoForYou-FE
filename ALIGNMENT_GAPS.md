# DoForYou - System Alignment Gaps & Action Plan

## Current Status: 40% Aligned

### ✅ What Works
- Basic task posting/browsing
- User authentication
- PayFast sandbox integration
- Simple task workflow
- Public task browsing

### ❌ Critical Missing Features

## PRIORITY 1: ESCROW SYSTEM (URGENT)

### Backend Changes Needed:
```sql
-- Add to Tasks table
ALTER TABLE tasks 
ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN payout_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN escrow_status VARCHAR(20) DEFAULT 'none',
ADD COLUMN escrow_hold_until TIMESTAMP;

-- Create escrow transactions table
CREATE TABLE escrow_transactions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER UNIQUE REFERENCES tasks(id),
    total_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    payout_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_received_at TIMESTAMP,
    scheduled_release_at TIMESTAMP,
    released_at TIMESTAMP
);
```

### Frontend Changes Needed:
```typescript
// Add to task.service.ts
calculateCommission(amount: number): { commission: number, payout: number } {
  const commission = Math.max(amount * 0.15, 5);
  const payout = amount - commission;
  return { commission, payout };
}

// Add escrow display component
<div class="escrow-breakdown">
  <div>Task Budget: R{{task.budget}}</div>
  <div>Commission (15%): -R{{task.commissionAmount}}</div>
  <div>Runner Payout: R{{task.payoutAmount}}</div>
</div>
```

## PRIORITY 2: WALLET SYSTEM

### Backend:
```sql
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    transaction_type VARCHAR(20),
    amount DECIMAL(10,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Frontend:
```typescript
// Add wallet component
export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
}
```

## PRIORITY 3: AUTO-RELEASE SERVICE

### Backend:
```csharp
// Create background service
public class EscrowReleaseService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ReleaseExpiredEscrows();
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
```

## PRIORITY 4: REAL-TIME FEATURES

### Backend:
```csharp
// Add SignalR
services.AddSignalR();
app.MapHub<ChatHub>("/hubs/chat");
```

### Frontend:
```typescript
// Add SignalR client
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5001/hubs/chat')
  .build();
```

## IMPLEMENTATION TIMELINE

### Week 1: Escrow System
- [ ] Add database columns
- [ ] Update PaymentService
- [ ] Add commission calculation
- [ ] Update frontend to show breakdown

### Week 2: Wallet System
- [ ] Create wallet tables
- [ ] Add transaction endpoints
- [ ] Build wallet UI
- [ ] Add transaction history

### Week 3: Auto-Release
- [ ] Create background service
- [ ] Add escrow release logic
- [ ] Test 48-hour hold
- [ ] Add admin override

### Week 4: Real-time Features
- [ ] Add SignalR to backend
- [ ] Create chat hub
- [ ] Build chat UI
- [ ] Add notifications

## TESTING CHECKLIST

### Escrow Flow:
1. [ ] User creates task (R500)
2. [ ] Commission calculated (R75)
3. [ ] Payout calculated (R425)
4. [ ] Payment via PayFast
5. [ ] Funds held in escrow
6. [ ] Task completed
7. [ ] 48-hour hold starts
8. [ ] Auto-release after 48h
9. [ ] Runner receives R425
10. [ ] Platform receives R75

### Security:
- [ ] SQL injection tests
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Token validation

## DEPLOYMENT READINESS

### Current: 40%
- [x] Basic functionality
- [x] Authentication
- [x] Task management
- [ ] Escrow system
- [ ] Wallet system
- [ ] Real-time features
- [ ] Fraud detection
- [ ] Analytics
- [ ] Monitoring
- [ ] CI/CD

### Target: 100%
All items above must be completed before production launch.

## COST ESTIMATE

### Development Time:
- Escrow System: 40 hours
- Wallet System: 30 hours
- Auto-Release: 20 hours
- Real-time Features: 50 hours
- Testing: 40 hours
- **Total: 180 hours (~4-5 weeks)**

### Infrastructure:
- Database: $50/month
- Hosting: $100/month
- SignalR: $30/month
- Monitoring: $20/month
- **Total: $200/month**

## NEXT STEPS

1. **Immediate**: Add escrow columns to database
2. **This Week**: Implement commission calculation
3. **Next Week**: Build wallet system
4. **Month 1**: Complete all Priority 1-4 items
5. **Month 2**: Testing and optimization
6. **Month 3**: Production launch

## CONTACT

For implementation questions:
- Backend: Review PaymentService.cs
- Frontend: Review task.service.ts
- Database: Review migration files
