namespace SistemasPresencia.API.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
    public string? FotoUrl { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
}

public class EstadoUsuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Icono { get; set; }
    public string? Descripcion { get; set; }
    public int Orden { get; set; }
}

public class SesionUsuario
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int EstadoId { get; set; }
    public DateTime FechaConexion { get; set; }
    public DateTime? FechaDesconexion { get; set; }
    public string? DireccionIP { get; set; }
    public string? NombreEquipo { get; set; }
    public bool Activa { get; set; }
}

public class UsuarioConectado
{
    public int UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
    public string? FotoUrl { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string ColorEstado { get; set; } = string.Empty;
    public string? IconoEstado { get; set; }
    public DateTime FechaConexion { get; set; }
    public string? DireccionIP { get; set; }
    public string? NombreEquipo { get; set; }
    public int MinutosConectado { get; set; }
}

// DTOs
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? Token { get; set; }
    public UsuarioDto? Usuario { get; set; }
}

public class UsuarioDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
    public string? FotoUrl { get; set; }
}

public class ConectarRequest
{
    public string? DireccionIP { get; set; }
    public string? NombreEquipo { get; set; }
}

public class CambiarEstadoRequest
{
    public int EstadoId { get; set; }
    public string? Motivo { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    
    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Message = message,
        Data = data
    };
    
    public static ApiResponse<T> Error(string message) => new()
    {
        Success = false,
        Message = message
    };
}

public class RegistroUsuarioRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
}
