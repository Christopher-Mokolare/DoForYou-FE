using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using DoForYou.Services;

namespace DoForYou.Services.Background;

public class EscrowReleaseService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EscrowReleaseService> _logger;
    private readonly TimeSpan _interval;

    public EscrowReleaseService(
        IServiceProvider serviceProvider,
        ILogger<EscrowReleaseService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        
        // Check every hour by default
        var intervalMinutes = configuration.GetValue<int>("BackgroundJobs:EscrowCheckIntervalMinutes", 60);
        _interval = TimeSpan.FromMinutes(intervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Escrow Release Service started. Checking every {Interval} minutes", _interval.TotalMinutes);

        // Wait 1 minute before first run
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredEscrowsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Escrow Release Service");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Escrow Release Service stopped");
    }

    private async Task ProcessExpiredEscrowsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var escrowService = scope.ServiceProvider.GetRequiredService<IEscrowService>();

        try
        {
            var releasedCount = await escrowService.AutoReleaseExpiredEscrowsAsync();

            if (releasedCount > 0)
            {
                _logger.LogInformation("Auto-released {Count} expired escrows", releasedCount);
            }
            else
            {
                _logger.LogDebug("No expired escrows to release");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing expired escrows");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Escrow Release Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}
