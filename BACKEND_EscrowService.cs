using Microsoft.EntityFrameworkCore;
using DoForYou.Data;
using DoForYou.Models;

namespace DoForYou.Services;

public interface IEscrowService
{
    Task<EscrowTransaction> CreateEscrowAsync(Task task);
    Task<bool> ReleaseEscrowAsync(int taskId);
    Task<int> AutoReleaseExpiredEscrowsAsync();
    decimal CalculateCommission(decimal amount);
}

public class EscrowService : IEscrowService
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;
    private readonly ILogger<EscrowService> _logger;
    private readonly IConfiguration _configuration;

    public EscrowService(
        ApplicationDbContext context,
        IWalletService walletService,
        ILogger<EscrowService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _walletService = walletService;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<EscrowTransaction> CreateEscrowAsync(Task task)
    {
        var commission = CalculateCommission(task.Budget);
        var payout = task.Budget - commission;

        var escrow = new EscrowTransaction
        {
            TaskId = task.Id,
            TotalAmount = task.Budget,
            CommissionAmount = commission,
            PayoutAmount = payout,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.EscrowTransactions.AddAsync(escrow);
        
        // Update task
        task.CommissionAmount = commission;
        task.PayoutAmount = payout;
        task.EscrowStatus = "pending";
        
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Escrow created for task {TaskId}: Total={Total}, Commission={Commission}, Payout={Payout}",
            task.Id, task.Budget, commission, payout);

        return escrow;
    }

    public async Task<bool> ReleaseEscrowAsync(int taskId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var task = await _context.Tasks
                .Include(t => t.AcceptedByUser)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null || task.AcceptedByUserId == null)
            {
                _logger.LogWarning("Cannot release escrow: Task {TaskId} not found or no runner", taskId);
                return false;
            }

            var escrow = await _context.EscrowTransactions
                .FirstOrDefaultAsync(e => e.TaskId == taskId);

            if (escrow == null || escrow.Status != "held")
            {
                _logger.LogWarning("Cannot release escrow: Invalid status for task {TaskId}", taskId);
                return false;
            }

            // Check if hold period has passed
            if (task.EscrowHoldUntil.HasValue && task.EscrowHoldUntil > DateTime.UtcNow)
            {
                _logger.LogWarning("Cannot release escrow: Hold period not expired for task {TaskId}", taskId);
                return false;
            }

            // Create wallet transaction for runner (payout)
            await _walletService.CreateTransactionAsync(new WalletTransaction
            {
                UserId = task.AcceptedByUserId.Value,
                TaskId = task.Id,
                TransactionType = "payout",
                Amount = escrow.PayoutAmount,
                Description = $"Task completion: {task.TaskDescription}",
                Reference = $"ESCROW-{task.TaskId}",
                Status = "completed",
                CreatedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow
            });

            // Create wallet transaction for platform (commission)
            // Note: You'll need a system/platform user ID
            var platformUserId = 1; // Replace with actual platform user ID
            await _walletService.CreateTransactionAsync(new WalletTransaction
            {
                UserId = platformUserId,
                TaskId = task.Id,
                TransactionType = "commission",
                Amount = escrow.CommissionAmount,
                Description = $"Platform commission: {task.TaskDescription}",
                Reference = $"COMM-{task.TaskId}",
                Status = "completed",
                CreatedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow
            });

            // Update escrow status
            escrow.Status = "released";
            escrow.ReleasedAt = DateTime.UtcNow;
            escrow.UpdatedAt = DateTime.UtcNow;

            // Update task status
            task.EscrowStatus = "released";
            task.PaymentStatus = "EscrowReleased";
            task.TaskStatus = "RunnerPaid";
            task.PaidToRunnerAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Escrow released for task {TaskId}: Runner received R{Payout}, Platform received R{Commission}",
                taskId, escrow.PayoutAmount, escrow.CommissionAmount);

            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error releasing escrow for task {TaskId}", taskId);
            throw;
        }
    }

    public async Task<int> AutoReleaseExpiredEscrowsAsync()
    {
        var expiredTasks = await _context.Tasks
            .Where(t => t.EscrowStatus == "held" &&
                       t.EscrowHoldUntil.HasValue &&
                       t.EscrowHoldUntil <= DateTime.UtcNow &&
                       t.TaskStatus == "Completed")
            .ToListAsync();

        int releasedCount = 0;

        foreach (var task in expiredTasks)
        {
            try
            {
                var success = await ReleaseEscrowAsync(task.Id);
                if (success) releasedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auto-releasing escrow for task {TaskId}", task.Id);
            }
        }

        if (releasedCount > 0)
        {
            _logger.LogInformation("Auto-released {Count} expired escrows", releasedCount);
        }

        return releasedCount;
    }

    public decimal CalculateCommission(decimal amount)
    {
        var commissionPercentage = _configuration.GetValue<decimal>("PayFast:CommissionPercentage", 15.0m);
        var commission = amount * (commissionPercentage / 100);
        
        // Minimum commission R5
        return Math.Max(commission, 5.00m);
    }
}
