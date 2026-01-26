import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Usuario, EstadoUsuario, AuthContextType } from '../types';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEstado, setCurrentEstado] = useState<EstadoUsuario | null>(null);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUsuario = localStorage.getItem('auth_usuario');
    
    if (savedToken && savedUsuario) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUsuario));
      apiService.setToken(savedToken);
    }
  }, []);

  // Verificar estado de conexión al cargar
  useEffect(() => {
    if (token) {
      checkConnectionStatus();
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
  }, [isConnected]);

  const conectar = useCallback(async (): Promise<boolean> => {
    try {
      const hostname = window.location.hostname;
      const response = await apiService.conectar(hostname);
      
      if (response.success) {
        setIsConnected(true);
        // Estado por defecto: Activo (id: 1)
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
        // Obtener info actualizada del estado
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
