export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fotoUrl?: string;
}

export interface EstadoUsuario {
  id: number;
  nombre: string;
  color: string;
  icono?: string;
  descripcion?: string;
}

export interface UsuarioConectado {
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fotoUrl?: string;
  estadoId: number;
  estado: string;
  colorEstado: string;
  iconoEstado?: string;
  fechaConexion: string;
  direccionIP?: string;
  nombreEquipo?: string;
  minutosConectado: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  usuario?: Usuario;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isConnected: boolean;
  currentEstado: EstadoUsuario | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  conectar: () => Promise<boolean>;
  desconectar: () => Promise<boolean>;
  cambiarEstado: (estadoId: number) => Promise<boolean>;
}
