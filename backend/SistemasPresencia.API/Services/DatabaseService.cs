using Microsoft.Data.SqlClient;
using System.Data;

namespace SistemasPresencia.API.Services;

public class DatabaseService
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(IConfiguration configuration, ILogger<DatabaseService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        _logger = logger;
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            using var connection = CreateConnection();
            connection.Open();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing database connection");
            return false;
        }
    }
}
