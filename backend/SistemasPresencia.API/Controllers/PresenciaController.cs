using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SistemasPresencia.API.Hubs;
using SistemasPresencia.API.Models;
using SistemasPresencia.API.Services;

namespace SistemasPresencia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PresenciaController : ControllerBase
{
    private readonly PresenciaService _presenciaService;
    private readonly AuthService _authService;
    private readonly IHubContext<PresenciaHub> _hubContext;

    public PresenciaController(
        PresenciaService presenciaService, 
        AuthService authService,
        IHubContext<PresenciaHub> hubContext)
    {
        _presenciaService = presenciaService;
        _authService = authService;
        _hubContext = hubContext;
    }

    [HttpPost("conectar")]
    public async Task<ActionResult<ApiResponse<int>>> Conectar([FromBody] ConectarRequest request)
    {
        var userId = _authService.GetUserIdFromToken(User);
        if (userId == null)
        {
            return Unauthorized(ApiResponse<int>.Error("Usuario no autenticado"));
        }

        // Auto-detectar IP si no se envía
        if (string.IsNullOrEmpty(request.DireccionIP))
        {
            request.DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        var result = await _presenciaService.ConectarAsync(userId.Value, request);
        
        if (result.Success)
        {
            // Notificar a todos los clientes conectados
            await NotificarCambioAsync();
        }

        return Ok(result);
    }

    [HttpPost("desconectar")]
    public async Task<ActionResult<ApiResponse<bool>>> Desconectar()
    {
        var userId = _authService.GetUserIdFromToken(User);
        if (userId == null)
        {
            return Unauthorized(ApiResponse<bool>.Error("Usuario no autenticado"));
        }

        var result = await _presenciaService.DesconectarAsync(userId.Value);
        
        if (result.Success)
        {
            // Notificar a todos los clientes conectados
            await NotificarCambioAsync();
        }

        return Ok(result);
    }

    [HttpPut("estado")]
    public async Task<ActionResult<ApiResponse<bool>>> CambiarEstado([FromBody] CambiarEstadoRequest request)
    {
        var userId = _authService.GetUserIdFromToken(User);
        if (userId == null)
        {
            return Unauthorized(ApiResponse<bool>.Error("Usuario no autenticado"));
        }

        var result = await _presenciaService.CambiarEstadoAsync(userId.Value, request);
        
        if (result.Success)
        {
            // Notificar a todos los clientes conectados
            await NotificarCambioAsync();
        }

        return Ok(result);
    }

    [HttpGet("conectados")]
    [AllowAnonymous] // Permitir ver usuarios conectados sin autenticación
    public async Task<ActionResult<ApiResponse<IEnumerable<UsuarioConectado>>>> ObtenerUsuariosConectados()
    {
        var result = await _presenciaService.ObtenerUsuariosConectadosAsync();
        return Ok(result);
    }

    [HttpGet("estados")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EstadoUsuario>>>> ObtenerEstados()
    {
        var result = await _presenciaService.ObtenerEstadosAsync();
        return Ok(result);
    }

    [HttpGet("mi-estado")]
    public async Task<ActionResult<ApiResponse<UsuarioConectado>>> ObtenerMiEstado()
    {
        var userId = _authService.GetUserIdFromToken(User);
        if (userId == null)
        {
            return Unauthorized(ApiResponse<UsuarioConectado>.Error("Usuario no autenticado"));
        }

        var estado = await _presenciaService.ObtenerEstadoUsuarioAsync(userId.Value);
        
        if (estado == null)
        {
            return Ok(ApiResponse<UsuarioConectado>.Error("No hay sesión activa"));
        }

        return Ok(ApiResponse<UsuarioConectado>.Ok(estado));
    }

    private async Task NotificarCambioAsync()
    {
        var usuarios = await _presenciaService.ObtenerUsuariosConectadosAsync();
        if (usuarios.Success)
        {
            await _hubContext.Clients.All.SendAsync("UsuariosActualizados", usuarios.Data);
        }
    }
}
