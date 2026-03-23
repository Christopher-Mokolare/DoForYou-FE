using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using DoForYou.Data;
using DoForYou.Models;
using System.Security.Claims;

namespace DoForYou.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ApplicationDbContext context, ILogger<ChatHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        _logger.LogInformation("User {UserId} connected to chat hub", userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        _logger.LogInformation("User {UserId} disconnected from chat hub", userId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(int taskId, string message)
    {
        try
        {
            var senderId = GetUserId();
            var task = await _context.Tasks
                .Include(t => t.CreatedByUser)
                .Include(t => t.AcceptedByUser)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                await Clients.Caller.SendAsync("Error", "Task not found");
                return;
            }

            // Determine receiver
            int receiverId;
            if (task.CreatedByUserId == senderId)
            {
                receiverId = task.AcceptedByUserId ?? 0;
            }
            else if (task.AcceptedByUserId == senderId)
            {
                receiverId = task.CreatedByUserId;
            }
            else
            {
                await Clients.Caller.SendAsync("Error", "You are not part of this conversation");
                return;
            }

            // Save message to database
            var chatMessage = new ChatMessage
            {
                TaskId = taskId,
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                MessageType = "text",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.ChatMessages.AddAsync(chatMessage);
            await _context.SaveChangesAsync();

            // Get sender info
            var sender = await _context.Users.FindAsync(senderId);

            // Send to receiver
            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", new
            {
                id = chatMessage.Id,
                taskId = taskId,
                senderId = senderId,
                senderName = $"{sender?.FirstName} {sender?.LastName}",
                message = message,
                messageType = "text",
                isRead = false,
                createdAt = chatMessage.CreatedAt
            });

            // Confirm to sender
            await Clients.Caller.SendAsync("MessageSent", new
            {
                id = chatMessage.Id,
                taskId = taskId,
                message = message,
                createdAt = chatMessage.CreatedAt
            });

            _logger.LogInformation("Message sent: Task={TaskId}, From={SenderId}, To={ReceiverId}", 
                taskId, senderId, receiverId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            await Clients.Caller.SendAsync("Error", "Failed to send message");
        }
    }

    public async Task Typing(int taskId, bool isTyping)
    {
        try
        {
            var userId = GetUserId();
            var task = await _context.Tasks.FindAsync(taskId);

            if (task == null) return;

            // Determine who to notify
            int notifyUserId = task.CreatedByUserId == userId 
                ? (task.AcceptedByUserId ?? 0) 
                : task.CreatedByUserId;

            if (notifyUserId > 0)
            {
                await Clients.User(notifyUserId.ToString()).SendAsync("UserTyping", new
                {
                    taskId = taskId,
                    userId = userId,
                    isTyping = isTyping
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending typing indicator");
        }
    }

    public async Task JoinTaskChat(int taskId)
    {
        var userId = GetUserId();
        var groupName = $"task-{taskId}";
        
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("User {UserId} joined task {TaskId} chat", userId, taskId);
    }

    public async Task LeaveTaskChat(int taskId)
    {
        var userId = GetUserId();
        var groupName = $"task-{taskId}";
        
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("User {UserId} left task {TaskId} chat", userId, taskId);
    }

    public async Task MarkAsRead(int messageId)
    {
        try
        {
            var message = await _context.ChatMessages.FindAsync(messageId);
            if (message != null && message.ReceiverId == GetUserId())
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Notify sender
                await Clients.User(message.SenderId.ToString()).SendAsync("MessageRead", new
                {
                    messageId = messageId,
                    readAt = message.ReadAt
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message as read");
        }
    }

    // Notification methods
    public async Task SendNotification(int userId, string type, string title, string message)
    {
        await Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new
        {
            type = type,
            title = title,
            message = message,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastTaskUpdate(int taskId, string status)
    {
        var groupName = $"task-{taskId}";
        await Clients.Group(groupName).SendAsync("TaskStatusUpdated", new
        {
            taskId = taskId,
            status = status,
            timestamp = DateTime.UtcNow
        });
    }

    private int GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}
