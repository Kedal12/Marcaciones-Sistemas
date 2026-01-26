using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasPresencia.API.Models;
using SistemasPresencia.API.Services;

namespace SistemasPresencia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new LoginResponse
            {
                Success = false,
                Message = "Usuario y contraseña son requeridos"
            });
        }

        var result = await _authService.LoginAsync(request);
        
        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    [HttpPost("registro")]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> Registro([FromBody] RegistroUsuarioRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || 
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.NombreCompleto) ||
            string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(ApiResponse<UsuarioDto>.Error("Todos los campos requeridos deben ser completados"));
        }

        var result = await _authService.RegistrarUsuarioAsync(request);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("perfil")]
    public ActionResult<ApiResponse<object>> GetPerfil()
    {
        var userId = _authService.GetUserIdFromToken(User);
        var username = User.Identity?.Name;
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;
        var nombre = User.FindFirst("nombre")?.Value;

        return Ok(ApiResponse<object>.Ok(new
        {
            Id = userId,
            Username = username,
            Email = email,
            NombreCompleto = nombre
        }));
    }
}
