import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Usuario, EstadoUsuario, AuthContextType } from '../types';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEstado, setCurrentEstado] = useState<EstadoUsuario | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Función para cerrar sesión limpiamente
  const logout = useCallback(() => {
    if (isConnected) {
      apiService.desconectar().catch(console.error);
    }

    setToken(null);
    setUsuario(null);
    setIsConnected(false);
    setCurrentEstado(null);
    apiService.setToken(null);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');

    // Limpiar keepalive
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, [isConnected]);

  // Registrar callback para token expirado
  useEffect(() => {
    apiService.setOnTokenExpired(() => {
      console.warn('Sesión expirada, forzando logout...');
      setToken(null);
      setUsuario(null);
      setIsConnected(false);
      setCurrentEstado(null);
      apiService.setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    });
  }, []);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUsuario = localStorage.getItem('auth_usuario');

    if (savedToken && savedUsuario) {
      try {
        // Verificar si el token no ha expirado
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const expiration = payload.exp * 1000;

        if (Date.now() >= expiration) {
          console.warn('Token guardado ya expiró, limpiando sesión...');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_usuario');
          return;
        }

        setToken(savedToken);
        setUsuario(JSON.parse(savedUsuario));
        apiService.setToken(savedToken);
      } catch (e) {
        console.error('Error restaurando sesión:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_usuario');
      }
    }
  }, []);

  // Verificar estado de conexión al cargar
  useEffect(() => {
    if (token) {
      checkConnectionStatus();
    }
  }, [token]);

  // KeepAlive: verificar sesión cada 5 minutos
  useEffect(() => {
    if (token) {
      const checkSession = async () => {
        try {
          await apiService.obtenerEstados();
        } catch (error: any) {
          console.warn('Error en keepalive:', error.message);
        }
      };

      keepAliveRef.current = setInterval(checkSession, 5 * 60 * 1000);

      return () => {
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
        }
      };
    }
  }, [token]);

  const checkConnectionStatus = async () => {
    try {
      const response = await apiService.obtenerMiEstado();
      if (response.success && response.data) {
        setIsConnected(true);
        setCurrentEstado({
          id: response.data.estadoId,
          nombre: response.data.estado,
          color: response.data.colorEstado,
          icono: response.data.iconoEstado,
        });
      } else {
        setIsConnected(false);
        setCurrentEstado(null);
      }
    } catch {
      setIsConnected(false);
      setCurrentEstado(null);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);

      if (response.success && response.token && response.usuario) {
        setToken(response.token);
        setUsuario(response.usuario);
        apiService.setToken(response.token);

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_usuario', JSON.stringify(response.usuario));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }, []);

  const conectar = useCallback(async (): Promise<boolean> => {
    try {
      const hostname = window.location.hostname;
      const response = await apiService.conectar(hostname);

      if (response.success) {
        setIsConnected(true);
        setCurrentEstado({
          id: 1,
          nombre: 'Activo',
          color: '#22C55E',
          icono: 'check-circle',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al conectar:', error);
      return false;
    }
  }, []);

  const desconectar = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiService.desconectar();

      if (response.success) {
        setIsConnected(false);
        setCurrentEstado(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al desconectar:', error);
      return false;
    }
  }, []);

  const cambiarEstado = useCallback(async (estadoId: number): Promise<boolean> => {
    try {
      const response = await apiService.cambiarEstado(estadoId);

      if (response.success) {
        const estadosResponse = await apiService.obtenerEstados();
        if (estadosResponse.success && estadosResponse.data) {
          const nuevoEstado = estadosResponse.data.find(e => e.id === estadoId);
          if (nuevoEstado) {
            setCurrentEstado(nuevoEstado);
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return false;
    }
  }, []);

  const value: AuthContextType = {
    usuario,
    token,
    isAuthenticated: !!token && !!usuario,
    isConnected,
    currentEstado,
    login,
    logout,
    conectar,
    desconectar,
    cambiarEstado,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
