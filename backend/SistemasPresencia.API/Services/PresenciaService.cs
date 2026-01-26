using Dapper;
using SistemasPresencia.API.Models;

namespace SistemasPresencia.API.Services;

public class PresenciaService
{
    private readonly DatabaseService _db;
    private readonly ILogger<PresenciaService> _logger;

    public PresenciaService(DatabaseService db, ILogger<PresenciaService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ApiResponse<int>> ConectarAsync(int usuarioId, ConectarRequest request)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            var sesionId = await connection.QuerySingleAsync<int>(
                "sp_Conectar",
                new 
                { 
                    UsuarioId = usuarioId,
                    request.DireccionIP,
                    request.NombreEquipo
                },
                commandType: System.Data.CommandType.StoredProcedure
            );

            return ApiResponse<int>.Ok(sesionId, "Conexión registrada exitosamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error conectando usuario {UsuarioId}", usuarioId);
            return ApiResponse<int>.Error("Error al conectar");
        }
    }

    public async Task<ApiResponse<bool>> DesconectarAsync(int usuarioId)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            await connection.ExecuteAsync(
                "sp_Desconectar",
                new { UsuarioId = usuarioId },
                commandType: System.Data.CommandType.StoredProcedure
            );

            return ApiResponse<bool>.Ok(true, "Desconexión registrada exitosamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error desconectando usuario {UsuarioId}", usuarioId);
            return ApiResponse<bool>.Error("Error al desconectar");
        }
    }

    public async Task<ApiResponse<bool>> CambiarEstadoAsync(int usuarioId, CambiarEstadoRequest request)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            await connection.ExecuteAsync(
                "sp_CambiarEstado",
                new 
                { 
                    UsuarioId = usuarioId,
                    NuevoEstadoId = request.EstadoId,
                    request.Motivo
                },
                commandType: System.Data.CommandType.StoredProcedure
            );

            return ApiResponse<bool>.Ok(true, "Estado actualizado exitosamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cambiando estado de usuario {UsuarioId}", usuarioId);
            return ApiResponse<bool>.Error("Error al cambiar estado");
        }
    }

    public async Task<ApiResponse<IEnumerable<UsuarioConectado>>> ObtenerUsuariosConectadosAsync()
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            var usuarios = await connection.QueryAsync<UsuarioConectado>(
                "sp_ObtenerUsuariosConectados",
                commandType: System.Data.CommandType.StoredProcedure
            );

            return ApiResponse<IEnumerable<UsuarioConectado>>.Ok(usuarios);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo usuarios conectados");
            return ApiResponse<IEnumerable<UsuarioConectado>>.Error("Error al obtener usuarios conectados");
        }
    }

    public async Task<ApiResponse<IEnumerable<EstadoUsuario>>> ObtenerEstadosAsync()
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            var estados = await connection.QueryAsync<EstadoUsuario>(
                "sp_ObtenerEstados",
                commandType: System.Data.CommandType.StoredProcedure
            );

            return ApiResponse<IEnumerable<EstadoUsuario>>.Ok(estados);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo estados");
            return ApiResponse<IEnumerable<EstadoUsuario>>.Error("Error al obtener estados");
        }
    }

    public async Task<UsuarioConectado?> ObtenerEstadoUsuarioAsync(int usuarioId)
    {
        try
        {
            using var connection = _db.CreateConnection();
            
            return await connection.QueryFirstOrDefaultAsync<UsuarioConectado>(
                "SELECT * FROM vw_UsuariosConectados WHERE UsuarioId = @UsuarioId",
                new { UsuarioId = usuarioId }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo estado de usuario {UsuarioId}", usuarioId);
            return null;
        }
    }
}
