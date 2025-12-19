# Task Not Showing on Browse Page - Issue Analysis

## Problem
After creating a task and completing payment via PayFast, the task does not appear on the browse tasks page (`/api/v1/tasks/available` returns empty array).

## Root Cause
**Backend Issue**: The backend is not properly handling the PayFast payment webhook or updating task status after payment completion.

## Evidence from Network Logs
1. ✅ Task created successfully: `POST /api/v1/tasks` → 200 OK
2. ✅ Payment completed: PayFast sandbox payment successful
3. ❌ Task not available: `GET /api/v1/tasks/available?includeOwn=true` → returns `{count: 0, tasks: []}`

## Backend Requirements to Fix

### 1. PayFast ITN (Instant Transaction Notification) Webhook
The backend needs to implement/fix the PayFast ITN webhook handler:

```
POST /api/v1/payment/notify (or similar endpoint)
```

This endpoint should:
- Verify the payment signature from PayFast
- Update the task's `paymentStatus` from "PENDING" to "COMPLETED"
- Update the task's `taskStatus` to make it available (e.g., "POSTED", "VERIFIED", "AVAILABLE")
- Log the payment confirmation

### 2. Task Status Flow
Current flow appears to be:
```
Task Created → paymentStatus: "PENDING", taskStatus: "PENDING"
↓
Payment Completed (PayFast)
↓
❌ Status NOT updated (webhook missing/broken)
↓
Task remains PENDING → Not returned by /available endpoint
```

Should be:
```
Task Created → paymentStatus: "PENDING", taskStatus: "DRAFT"
↓
Payment Completed (PayFast sends ITN)
↓
✅ Backend webhook updates: paymentStatus: "COMPLETED", taskStatus: "POSTED"
↓
Task appears in /available endpoint
```

### 3. Available Tasks Endpoint Filter
Check the `/api/v1/tasks/available` endpoint filtering logic:

```csharp
// Current (likely):
WHERE taskStatus IN ('POSTED', 'VERIFIED', 'AVAILABLE') 
  AND paymentStatus = 'COMPLETED'

// Issue: Tasks with PENDING status are excluded
```

## Temporary Workarounds (Frontend)

### Option 1: Manual Status Check
Add a button to manually check task status after payment:

```typescript
checkTaskStatus(taskId: string) {
  this.errandsService.getTask(taskId).subscribe(task => {
    console.log('Task status:', task.paymentStatus, task.taskStatus);
  });
}
```

### Option 2: Polling After Payment
In payment-success component, poll the task status:

```typescript
pollTaskStatus(taskId: string, maxAttempts = 10) {
  let attempts = 0;
  const interval = setInterval(() => {
    this.errandsService.getTask(taskId).subscribe(task => {
      if (task.paymentStatus === 'COMPLETED' || attempts++ >= maxAttempts) {
        clearInterval(interval);
        this.router.navigate(['/browse-errands']);
      }
    });
  }, 2000);
}
```

## Backend Code Changes Needed

### 1. PayFast Webhook Controller (C#)
```csharp
[HttpPost("notify")]
[AllowAnonymous]
public async Task<IActionResult> PayFastNotify([FromForm] PayFastNotify notify)
{
    // Verify PayFast signature
    if (!VerifyPayFastSignature(notify))
        return BadRequest("Invalid signature");
    
    // Update task status
    var task = await _taskRepository.GetByPaymentIdAsync(notify.m_payment_id);
    if (task != null)
    {
        task.PaymentStatus = "COMPLETED";
        task.TaskStatus = "POSTED"; // or "VERIFIED"
        await _taskRepository.UpdateAsync(task);
    }
    
    return Ok();
}
```

### 2. Available Tasks Query
```csharp
public async Task<PaginatedResponse> GetAvailableTasks(int page, int pageSize, bool includeOwn)
{
    var query = _context.Tasks
        .Where(t => t.PaymentStatus == "COMPLETED")
        .Where(t => t.TaskStatus == "POSTED" || t.TaskStatus == "VERIFIED")
        .Where(t => t.HelperName == null); // Not claimed yet
    
    // ... pagination logic
}
```

## Testing Steps

1. Create a task in the frontend
2. Complete payment on PayFast sandbox
3. Check backend logs for webhook call from PayFast
4. Verify task status in database:
   ```sql
   SELECT taskId, paymentStatus, taskStatus, createdAt 
   FROM Tasks 
   ORDER BY createdAt DESC 
   LIMIT 1;
   ```
5. Call `/api/v1/tasks/available` and verify task appears

## PayFast Sandbox Configuration

Ensure PayFast sandbox is configured with correct webhook URLs:
- Return URL: `http://localhost:4200/payment-success`
- Cancel URL: `http://localhost:4200/payment-cancelled`
- Notify URL: `https://your-backend.railway.app/api/v1/payment/notify`

**Important**: PayFast cannot call `localhost` webhooks. The notify URL must be publicly accessible (e.g., Railway deployment).

## Next Steps

1. ✅ Added enhanced logging to frontend (errands.service.ts)
2. ⏳ Backend team needs to implement/fix PayFast webhook handler
3. ⏳ Backend team needs to verify task status update logic
4. ⏳ Test with PayFast sandbox and verify webhook is called
5. ⏳ Consider adding admin panel to manually verify payments if webhook fails
