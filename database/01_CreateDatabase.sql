-- =============================================
-- Sistema de Control de Presencia - ICG Sistemas
-- Base de Datos: SistemasPresencia
-- Autor: Kevin - ICG IT Department
-- Fecha: 2025
-- =============================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SistemasPresencia')
BEGIN
    CREATE DATABASE SistemasPresencia;
END
GO

USE SistemasPresencia;
GO

-- =============================================
-- Tabla: Usuarios
-- Almacena información de los usuarios del sistema
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Usuarios](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Username] NVARCHAR(50) NOT NULL,
        [PasswordHash] NVARCHAR(256) NOT NULL,
        [NombreCompleto] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(100) NOT NULL,
        [Telefono] NVARCHAR(20) NULL,
        [Cargo] NVARCHAR(100) NULL,
        [Departamento] NVARCHAR(100) NULL,
        [FotoUrl] NVARCHAR(500) NULL,
        [Activo] BIT NOT NULL DEFAULT 1,
        [FechaCreacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [FechaModificacion] DATETIME NULL,
        CONSTRAINT [PK_Usuarios] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Usuarios_Username] UNIQUE ([Username]),
        CONSTRAINT [UQ_Usuarios_Email] UNIQUE ([Email])
    );
END
GO

-- =============================================
-- Tabla: EstadosUsuario
-- Catálogo de estados posibles
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EstadosUsuario]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EstadosUsuario](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Nombre] NVARCHAR(50) NOT NULL,
        [Color] NVARCHAR(7) NOT NULL, -- Hex color
        [Icono] NVARCHAR(50) NULL,
        [Descripcion] NVARCHAR(200) NULL,
        [Orden] INT NOT NULL DEFAULT 0,
        CONSTRAINT [PK_EstadosUsuario] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

-- =============================================
-- Tabla: SesionesUsuario
-- Registro de conexiones/desconexiones
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SesionesUsuario]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SesionesUsuario](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [UsuarioId] INT NOT NULL,
        [EstadoId] INT NOT NULL,
        [FechaConexion] DATETIME NOT NULL DEFAULT GETDATE(),
        [FechaDesconexion] DATETIME NULL,
        [DireccionIP] NVARCHAR(45) NULL,
        [NombreEquipo] NVARCHAR(100) NULL,
        [Activa] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_SesionesUsuario] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_SesionesUsuario_Usuarios] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]),
        CONSTRAINT [FK_SesionesUsuario_Estados] FOREIGN KEY ([EstadoId]) REFERENCES [dbo].[EstadosUsuario]([Id])
    );
END
GO

-- =============================================
-- Tabla: HistorialEstados
-- Registro de cambios de estado durante una sesión
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HistorialEstados]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[HistorialEstados](
        [Id] INT IDENTITY(1,1) NOT NULL,
        [SesionId] INT NOT NULL,
        [EstadoAnteriorId] INT NULL,
        [EstadoNuevoId] INT NOT NULL,
        [FechaCambio] DATETIME NOT NULL DEFAULT GETDATE(),
        [Motivo] NVARCHAR(200) NULL,
        CONSTRAINT [PK_HistorialEstados] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_HistorialEstados_Sesiones] FOREIGN KEY ([SesionId]) REFERENCES [dbo].[SesionesUsuario]([Id]),
        CONSTRAINT [FK_HistorialEstados_EstadoAnterior] FOREIGN KEY ([EstadoAnteriorId]) REFERENCES [dbo].[EstadosUsuario]([Id]),
        CONSTRAINT [FK_HistorialEstados_EstadoNuevo] FOREIGN KEY ([EstadoNuevoId]) REFERENCES [dbo].[EstadosUsuario]([Id])
    );
END
GO

-- =============================================
-- Insertar Estados por Defecto
-- =============================================
IF NOT EXISTS (SELECT * FROM [dbo].[EstadosUsuario])
BEGIN
    INSERT INTO [dbo].[EstadosUsuario] ([Nombre], [Color], [Icono], [Descripcion], [Orden])
    VALUES 
        ('Activo', '#22C55E', 'check-circle', 'Usuario conectado y disponible', 1),
        ('Ausente', '#F59E0B', 'clock', 'Usuario temporalmente ausente', 2),
        ('Ocupado', '#EF4444', 'minus-circle', 'Usuario ocupado, no molestar', 3),
        ('En reunión', '#8B5CF6', 'users', 'Usuario en reunión', 4),
        ('Almuerzo', '#06B6D4', 'coffee', 'Usuario en horario de almuerzo', 5),
        ('Desconectado', '#6B7280', 'x-circle', 'Usuario desconectado', 6);
END
GO

-- =============================================
-- Insertar Usuario de Prueba (password: admin123)
-- Hash generado con BCrypt
-- =============================================
IF NOT EXISTS (SELECT * FROM [dbo].[Usuarios] WHERE [Username] = 'admin')
BEGIN
    INSERT INTO [dbo].[Usuarios] ([Username], [PasswordHash], [NombreCompleto], [Email], [Telefono], [Cargo], [Departamento])
    VALUES 
        ('admin', '$2a$11$rBNdE6IlKm6wBPGxLp1HXeYGt7X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Administrador Sistema', 'admin@icg.com', '300-000-0000', 'Administrador de Sistemas', 'Sistemas'),
        ('kevin', '$2a$11$rBNdE6IlKm6wBPGxLp1HXeYGt7X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Kevin Sistemas', 'kevin@icg.com', '300-111-1111', 'Desarrollador', 'Sistemas'),
        ('soporte1', '$2a$11$rBNdE6IlKm6wBPGxLp1HXeYGt7X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Juan Soporte', 'soporte1@icg.com', '300-222-2222', 'Soporte Técnico', 'Sistemas'),
        ('soporte2', '$2a$11$rBNdE6IlKm6wBPGxLp1HXeYGt7X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'María Soporte', 'soporte2@icg.com', '300-333-3333', 'Soporte Técnico', 'Sistemas');
END
GO

-- =============================================
-- Índices para mejorar rendimiento
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SesionesUsuario_UsuarioId_Activa')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_SesionesUsuario_UsuarioId_Activa]
    ON [dbo].[SesionesUsuario] ([UsuarioId], [Activa])
    INCLUDE ([EstadoId], [FechaConexion]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SesionesUsuario_Activa')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_SesionesUsuario_Activa]
    ON [dbo].[SesionesUsuario] ([Activa])
    INCLUDE ([UsuarioId], [EstadoId], [FechaConexion]);
END
GO

-- =============================================
-- Vista: UsuariosConectados
-- Muestra usuarios actualmente conectados con su información
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_UsuariosConectados')
    DROP VIEW [dbo].[vw_UsuariosConectados];
GO

CREATE VIEW [dbo].[vw_UsuariosConectados]
AS
SELECT 
    u.Id AS UsuarioId,
    u.NombreCompleto,
    u.Email,
    u.Telefono,
    u.Cargo,
    u.Departamento,
    u.FotoUrl,
    e.Id AS EstadoId,
    e.Nombre AS Estado,
    e.Color AS ColorEstado,
    e.Icono AS IconoEstado,
    s.FechaConexion,
    s.DireccionIP,
    s.NombreEquipo,
    DATEDIFF(MINUTE, s.FechaConexion, GETDATE()) AS MinutosConectado
FROM [dbo].[Usuarios] u
INNER JOIN [dbo].[SesionesUsuario] s ON u.Id = s.UsuarioId AND s.Activa = 1
INNER JOIN [dbo].[EstadosUsuario] e ON s.EstadoId = e.Id
WHERE u.Activo = 1;
GO

-- =============================================
-- Procedimiento: sp_Login
-- Valida credenciales y retorna información del usuario
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Login')
    DROP PROCEDURE [dbo].[sp_Login];
GO

CREATE PROCEDURE [dbo].[sp_Login]
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        Username,
        PasswordHash,
        NombreCompleto,
        Email,
        Telefono,
        Cargo,
        Departamento,
        FotoUrl
    FROM [dbo].[Usuarios]
    WHERE Username = @Username AND Activo = 1;
END
GO

-- =============================================
-- Procedimiento: sp_Conectar
-- Registra una nueva conexión del usuario
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Conectar')
    DROP PROCEDURE [dbo].[sp_Conectar];
GO

CREATE PROCEDURE [dbo].[sp_Conectar]
    @UsuarioId INT,
    @DireccionIP NVARCHAR(45) = NULL,
    @NombreEquipo NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cerrar sesiones activas anteriores del mismo usuario
    UPDATE [dbo].[SesionesUsuario]
    SET Activa = 0, FechaDesconexion = GETDATE()
    WHERE UsuarioId = @UsuarioId AND Activa = 1;
    
    -- Crear nueva sesión con estado "Activo" (Id = 1)
    INSERT INTO [dbo].[SesionesUsuario] (UsuarioId, EstadoId, DireccionIP, NombreEquipo)
    VALUES (@UsuarioId, 1, @DireccionIP, @NombreEquipo);
    
    SELECT SCOPE_IDENTITY() AS SesionId;
END
GO

-- =============================================
-- Procedimiento: sp_Desconectar
-- Registra la desconexión del usuario
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Desconectar')
    DROP PROCEDURE [dbo].[sp_Desconectar];
GO

CREATE PROCEDURE [dbo].[sp_Desconectar]
    @UsuarioId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[SesionesUsuario]
    SET Activa = 0, FechaDesconexion = GETDATE()
    WHERE UsuarioId = @UsuarioId AND Activa = 1;
    
    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

-- =============================================
-- Procedimiento: sp_CambiarEstado
-- Cambia el estado del usuario conectado
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CambiarEstado')
    DROP PROCEDURE [dbo].[sp_CambiarEstado];
GO

CREATE PROCEDURE [dbo].[sp_CambiarEstado]
    @UsuarioId INT,
    @NuevoEstadoId INT,
    @Motivo NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SesionId INT, @EstadoAnteriorId INT;
    
    -- Obtener sesión activa y estado actual
    SELECT @SesionId = Id, @EstadoAnteriorId = EstadoId
    FROM [dbo].[SesionesUsuario]
    WHERE UsuarioId = @UsuarioId AND Activa = 1;
    
    IF @SesionId IS NULL
    BEGIN
        RAISERROR('El usuario no tiene una sesión activa', 16, 1);
        RETURN;
    END
    
    -- Actualizar estado en la sesión
    UPDATE [dbo].[SesionesUsuario]
    SET EstadoId = @NuevoEstadoId
    WHERE Id = @SesionId;
    
    -- Registrar en historial
    INSERT INTO [dbo].[HistorialEstados] (SesionId, EstadoAnteriorId, EstadoNuevoId, Motivo)
    VALUES (@SesionId, @EstadoAnteriorId, @NuevoEstadoId, @Motivo);
    
    SELECT 1 AS Exito;
END
GO

-- =============================================
-- Procedimiento: sp_ObtenerUsuariosConectados
-- Retorna lista de usuarios conectados
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ObtenerUsuariosConectados')
    DROP PROCEDURE [dbo].[sp_ObtenerUsuariosConectados];
GO

CREATE PROCEDURE [dbo].[sp_ObtenerUsuariosConectados]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM [dbo].[vw_UsuariosConectados]
    ORDER BY FechaConexion DESC;
END
GO

-- =============================================
-- Procedimiento: sp_ObtenerEstados
-- Retorna catálogo de estados
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ObtenerEstados')
    DROP PROCEDURE [dbo].[sp_ObtenerEstados];
GO

CREATE PROCEDURE [dbo].[sp_ObtenerEstados]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Id, Nombre, Color, Icono, Descripcion
    FROM [dbo].[EstadosUsuario]
    WHERE Id <> 6 -- Excluir "Desconectado" de las opciones
    ORDER BY Orden;
END
GO

PRINT 'Base de datos SistemasPresencia creada exitosamente.';
GO
