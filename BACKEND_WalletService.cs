using Microsoft.EntityFrameworkCore;
using DoForYou.Data;
using DoForYou.Models;

namespace DoForYou.Services;

public interface IWalletService
{
    Task<WalletTransaction> CreateTransactionAsync(WalletTransaction transaction);
    Task<decimal> GetBalanceAsync(int userId);
    Task<List<WalletTransaction>> GetTransactionsAsync(int userId, int page = 1, int pageSize = 20);
    Task<bool> ProcessWithdrawalAsync(int userId, decimal amount, string paymentMethod, object accountDetails);
}

public class WalletService : IWalletService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WalletService> _logger;

    public WalletService(ApplicationDbContext context, ILogger<WalletService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WalletTransaction> CreateTransactionAsync(WalletTransaction transaction)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var user = await _context.Users.FindAsync(transaction.UserId);
            if (user == null)
                throw new Exception($"User {transaction.UserId} not found");

            // Set balance before
            transaction.BalanceBefore = user.WalletBalance;

            // Calculate new balance
            if (transaction.TransactionType is "deposit" or "payout" or "bonus" or "refund")
            {
                user.WalletBalance += transaction.Amount;
            }
            else if (transaction.TransactionType is "withdrawal" or "commission")
            {
                if (user.WalletBalance < transaction.Amount)
                    throw new Exception("Insufficient balance");
                
                user.WalletBalance -= transaction.Amount;
            }

            transaction.BalanceAfter = user.WalletBalance;
            transaction.CreatedAt = DateTime.UtcNow;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.WalletTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation(
                "Wallet transaction created: User={UserId}, Type={Type}, Amount={Amount}, Balance={Balance}",
                transaction.UserId, transaction.TransactionType, transaction.Amount, user.WalletBalance);

            return transaction;
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            _logger.LogError(ex, "Error creating wallet transaction for user {UserId}", transaction.UserId);
            throw;
        }
    }

    public async Task<decimal> GetBalanceAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.WalletBalance ?? 0;
    }

    public async Task<List<WalletTransaction>> GetTransactionsAsync(int userId, int page = 1, int pageSize = 20)
    {
        return await _context.WalletTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<bool> ProcessWithdrawalAsync(int userId, decimal amount, string paymentMethod, object accountDetails)
    {
        // Validate minimum withdrawal
        if (amount < 100)
            throw new Exception("Minimum withdrawal amount is R100");

        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.WalletBalance < amount)
            throw new Exception("Insufficient balance");

        // Create withdrawal transaction
        var transaction = new WalletTransaction
        {
            UserId = userId,
            TransactionType = "withdrawal",
            Amount = amount,
            Description = $"Withdrawal via {paymentMethod}",
            Reference = $"WD-{DateTime.UtcNow:yyyyMMddHHmmss}-{userId}",
            Status = "pending",
            PaymentMethod = paymentMethod,
            PaymentDetails = System.Text.Json.JsonSerializer.Serialize(accountDetails)
        };

        await CreateTransactionAsync(transaction);

        _logger.LogInformation("Withdrawal requested: User={UserId}, Amount={Amount}", userId, amount);

        return true;
    }
}
