# 🖥️ ICG Sistemas - Control de Presencia

Sistema de control de presencia en tiempo real para el departamento de Sistemas de ICG. Permite a los miembros del equipo conectarse, cambiar su estado y ver quién está disponible.

![Login](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)

## 📋 Características

- ✅ **Login seguro** con JWT y contraseñas hasheadas con BCrypt
- ✅ **Estados en tiempo real** - Activo, Ausente, Ocupado, En reunión, Almuerzo
- ✅ **Panel de equipo** - Ve quién está conectado con su información de contacto
- ✅ **Actualizaciones en vivo** - SignalR para notificaciones instantáneas
- ✅ **Diseño responsivo** - Funciona en desktop y móvil
- ✅ **Interfaz moderna** - UI profesional con glassmorphism y animaciones

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React + TS    │────▶│  .NET 8 API     │────▶│  SQL Server     │
│   (Frontend)    │◀────│  + SignalR      │◀────│  (Database)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Instalación

### Requisitos Previos

- SQL Server 2019+ (o SQL Express)
- .NET 8 SDK
- Node.js 18+
- npm o yarn

### 1. Base de Datos

```bash
# Conectarse a SQL Server y ejecutar el script
sqlcmd -S localhost -i database/01_CreateDatabase.sql

# O desde SQL Server Management Studio (SSMS):
# Abrir y ejecutar database/01_CreateDatabase.sql
```

### 2. Backend API

```bash
cd backend/SistemasPresencia.API

# Restaurar paquetes
dotnet restore

# Configurar la conexión a la base de datos en appsettings.json:
# "ConnectionStrings": {
#   "DefaultConnection": "Server=TU_SERVIDOR;Database=SistemasPresencia;Trusted_Connection=True;TrustServerCertificate=True;"
# }

# Ejecutar en desarrollo
dotnet run

# O para producción
dotnet publish -c Release
```

La API estará disponible en:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger: `https://localhost:5001/swagger`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (crear .env)
echo "VITE_API_URL=https://localhost:5001/api" > .env
echo "VITE_HUB_URL=https://localhost:5001/hubs/presencia" >> .env

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

El frontend estará disponible en `http://localhost:5173`

## 🔐 Usuarios de Prueba

Después de ejecutar el script de base de datos, tendrás estos usuarios:

| Usuario   | Contraseña  | Nombre            |
|-----------|-------------|-------------------|
| admin     | admin123    | Administrador     |
| kevin     | admin123    | Kevin Sistemas    |
| soporte1  | admin123    | Juan Soporte      |
| soporte2  | admin123    | María Soporte     |

> ⚠️ **Importante**: Cambia las contraseñas en producción ejecutando:

```sql
-- Actualizar contraseña (el hash debe generarse con BCrypt)
UPDATE Usuarios SET PasswordHash = 'NUEVO_HASH' WHERE Username = 'admin';
```

## 📁 Estructura del Proyecto

```
sistemas-presencia/
├── database/
│   └── 01_CreateDatabase.sql      # Script SQL completo
├── backend/
│   └── SistemasPresencia.API/
│       ├── Controllers/           # Auth y Presencia controllers
│       ├── Services/              # Lógica de negocio
│       ├── Hubs/                  # SignalR hub
│       ├── Models/                # DTOs y entidades
│       └── Program.cs             # Configuración
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── context/               # Auth context
│   │   ├── services/              # API y SignalR
│   │   ├── types/                 # TypeScript types
│   │   └── App.tsx               
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 Configuración Avanzada

### Cambiar Puerto del Backend

En `backend/SistemasPresencia.API/Properties/launchSettings.json`:

```json
{
  "profiles": {
    "https": {
      "applicationUrl": "https://localhost:7001;http://localhost:5001"
    }
  }
}
```

### Configurar para Red Local

Para que otros equipos accedan, modifica:

**Backend** (`Program.cs`):
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://192.168.1.100:5173") // IP del servidor
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

**Frontend** (`.env`):
```
VITE_API_URL=http://192.168.1.100:5001/api
VITE_HUB_URL=http://192.168.1.100:5001/hubs/presencia
```

### Despliegue en IIS

1. Publicar el backend:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. Configurar IIS:
   - Crear nuevo sitio
   - Apuntar al folder `publish`
   - Habilitar WebSockets para SignalR

3. Publicar frontend:
   ```bash
   npm run build
   ```
   Los archivos estarán en `dist/`

## 📡 API Endpoints

### Autenticación

| Método | Endpoint          | Descripción           |
|--------|-------------------|-----------------------|
| POST   | /api/auth/login   | Iniciar sesión        |
| POST   | /api/auth/registro| Registrar usuario     |
| GET    | /api/auth/perfil  | Obtener perfil actual |

### Presencia

| Método | Endpoint                   | Descripción                |
|--------|----------------------------|----------------------------|
| POST   | /api/presencia/conectar    | Registrar conexión         |
| POST   | /api/presencia/desconectar | Registrar desconexión      |
| PUT    | /api/presencia/estado      | Cambiar estado             |
| GET    | /api/presencia/conectados  | Obtener usuarios conectados|
| GET    | /api/presencia/estados     | Obtener catálogo de estados|
| GET    | /api/presencia/mi-estado   | Obtener estado actual      |

## 🎨 Estados Disponibles

| Estado      | Color    | Icono        |
|-------------|----------|--------------|
| Activo      | 🟢 Verde | check-circle |
| Ausente     | 🟡 Amarillo | clock     |
| Ocupado     | 🔴 Rojo  | minus-circle |
| En reunión  | 🟣 Morado| users        |
| Almuerzo    | 🔵 Cyan  | coffee       |

## 🐛 Solución de Problemas

### Error de conexión a SQL Server

```
A network-related or instance-specific error occurred
```

**Solución**: 
1. Verificar que SQL Server esté corriendo
2. Habilitar TCP/IP en SQL Server Configuration Manager
3. Verificar el firewall

### Error de CORS

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solución**: Verificar que la URL del frontend esté en la política CORS del backend

### SignalR no conecta

**Solución**:
1. Verificar que WebSockets esté habilitado
2. Comprobar que la URL del hub sea correcta
3. Revisar que el token JWT se envíe correctamente

## 📝 Licencia

Proyecto interno de ICG - Uso exclusivo del departamento de Sistemas.

---

Desarrollado con ❤️ para ICG Sistemas
