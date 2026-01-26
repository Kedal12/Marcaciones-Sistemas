using Microsoft.AspNetCore.SignalR;

namespace SistemasPresencia.API.Hubs;

public class PresenciaHub : Hub
{
    private readonly ILogger<PresenciaHub> _logger;

    public PresenciaHub(ILogger<PresenciaHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Cliente conectado: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Cliente desconectado: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // Método para unirse a un grupo específico (por ejemplo, por departamento)
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Cliente {ConnectionId} se unió al grupo {Group}", Context.ConnectionId, groupName);
    }

    // Método para salir de un grupo
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Cliente {ConnectionId} salió del grupo {Group}", Context.ConnectionId, groupName);
    }
}
