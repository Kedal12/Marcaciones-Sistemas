import type { 
  LoginResponse, 
  ApiResponse, 
  UsuarioConectado, 
  EstadoUsuario 
} from '../types';

const API_BASE_URL = 'http://10.15.0.221:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error de red' }));
      throw new Error(error.message || 'Error en la solicitud');
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async registro(data: {
    username: string;
    password: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    cargo?: string;
    departamento?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async conectar(nombreEquipo?: string): Promise<ApiResponse<number>> {
    return this.request<ApiResponse<number>>('/presencia/conectar', {
      method: 'POST',
      body: JSON.stringify({ nombreEquipo }),
    });
  }

  async desconectar(): Promise<ApiResponse<boolean>> {
    return this.request<ApiResponse<boolean>>('/presencia/desconectar', {
      method: 'POST',
    });
  }

  async cambiarEstado(estadoId: number, motivo?: string): Promise<ApiResponse<boolean>> {
    return this.request<ApiResponse<boolean>>('/presencia/estado', {
      method: 'PUT',
      body: JSON.stringify({ estadoId, motivo }),
    });
  }

  async obtenerUsuariosConectados(): Promise<ApiResponse<UsuarioConectado[]>> {
    return this.request<ApiResponse<UsuarioConectado[]>>('/presencia/conectados');
  }

  async obtenerEstados(): Promise<ApiResponse<EstadoUsuario[]>> {
    return this.request<ApiResponse<EstadoUsuario[]>>('/presencia/estados');
  }

  async obtenerMiEstado(): Promise<ApiResponse<UsuarioConectado>> {
    return this.request<ApiResponse<UsuarioConectado>>('/presencia/mi-estado');
  }
}

export const apiService = new ApiService();
export default apiService;
