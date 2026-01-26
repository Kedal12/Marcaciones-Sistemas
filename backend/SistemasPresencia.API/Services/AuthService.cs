using Dapper;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SistemasPresencia.API.Models;

namespace SistemasPresencia.API.Services;

public class AuthService
{
    private readonly DatabaseService _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(DatabaseService db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            var usuario = await connection.QueryFirstOrDefaultAsync<Usuario>(
                "sp_Login",
                new { request.Username },
                commandType: System.Data.CommandType.StoredProcedure
            );

            if (usuario == null)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Usuario no encontrado"
                };
            }

            // Verificar contraseña con BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Contraseña incorrecta"
                };
            }

            // Generar JWT
            var token = GenerateJwtToken(usuario);

            return new LoginResponse
            {
                Success = true,
                Message = "Login exitoso",
                Token = token,
                Usuario = new UsuarioDto
                {
                    Id = usuario.Id,
                    Username = usuario.Username,
                    NombreCompleto = usuario.NombreCompleto,
                    Email = usuario.Email,
                    Telefono = usuario.Telefono,
                    Cargo = usuario.Cargo,
                    Departamento = usuario.Departamento,
                    FotoUrl = usuario.FotoUrl
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en login para usuario {Username}", request.Username);
            return new LoginResponse
            {
                Success = false,
                Message = "Error interno del servidor"
            };
        }
    }

    public async Task<ApiResponse<UsuarioDto>> RegistrarUsuarioAsync(RegistroUsuarioRequest request)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            // Verificar si ya existe el usuario
            var existe = await connection.QueryFirstOrDefaultAsync<int>(
                "SELECT COUNT(1) FROM Usuarios WHERE Username = @Username OR Email = @Email",
                new { request.Username, request.Email }
            );

            if (existe > 0)
            {
                return ApiResponse<UsuarioDto>.Error("El usuario o email ya existe");
            }

            // Hash de la contraseña
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Insertar usuario
            var id = await connection.QuerySingleAsync<int>(@"
                INSERT INTO Usuarios (Username, PasswordHash, NombreCompleto, Email, Telefono, Cargo, Departamento)
                OUTPUT INSERTED.Id
                VALUES (@Username, @PasswordHash, @NombreCompleto, @Email, @Telefono, @Cargo, @Departamento)",
                new
                {
                    request.Username,
                    PasswordHash = passwordHash,
                    request.NombreCompleto,
                    request.Email,
                    request.Telefono,
                    request.Cargo,
                    request.Departamento
                }
            );

            return ApiResponse<UsuarioDto>.Ok(new UsuarioDto
            {
                Id = id,
                Username = request.Username,
                NombreCompleto = request.NombreCompleto,
                Email = request.Email,
                Telefono = request.Telefono,
                Cargo = request.Cargo,
                Departamento = request.Departamento
            }, "Usuario registrado exitosamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registrando usuario {Username}", request.Username);
            return ApiResponse<UsuarioDto>.Error("Error al registrar usuario");
        }
    }

    private string GenerateJwtToken(Usuario usuario)
    {
        var key = _config["Jwt:Key"] ?? "ICG_SistemasPresencia_SecretKey_2025_SuperSegura_MinLength32Chars!";
        var issuer = _config["Jwt:Issuer"] ?? "SistemasPresencia";
        var expirationHours = int.Parse(_config["Jwt:ExpirationHours"] ?? "12");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, usuario.Username),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim("nombre", usuario.NombreCompleto),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public int? GetUserIdFromToken(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst(JwtRegisteredClaimNames.Sub);
        if (claim != null && int.TryParse(claim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}
