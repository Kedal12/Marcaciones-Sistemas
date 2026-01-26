import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Power, 
  PowerOff, 
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Users,
  Coffee,
  Cpu,
  RefreshCw,
  Phone,
  Mail,
  Monitor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UsuariosConectadosPanel } from './UsuariosConectadosPanel';
import apiService from '../services/api';
import signalRService from '../services/signalr';
import type { EstadoUsuario, UsuarioConectado } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'minus-circle': MinusCircle,
  'clock': Clock,
  'users': Users,
  'coffee': Coffee,
};

export function Dashboard() {
  const { 
    usuario, 
    logout, 
    isConnected, 
    currentEstado, 
    conectar, 
    desconectar, 
    cambiarEstado,
    token 
  } = useAuth();
  
  const [estados, setEstados] = useState<EstadoUsuario[]>([]);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuariosConectados, setUsuariosConectados] = useState<UsuarioConectado[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await apiService.obtenerEstados();
        if (response.success && response.data) {
          setEstados(response.data);
        }
      } catch (error) {
        console.error('Error cargando estados:', error);
      }
    };
    fetchEstados();
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await apiService.obtenerUsuariosConectados();
        if (response.success && response.data) {
          setUsuariosConectados(response.data);
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setLoadingUsuarios(false);
      }
    };
    
    fetchUsuarios();
    
    const initSignalR = async () => {
      try {
        await signalRService.start(token || undefined);
        signalRService.onUsuariosActualizados((usuarios) => {
          setUsuariosConectados(usuarios);
        });
      } catch (error) {
        console.error('Error conectando SignalR:', error);
      }
    };
    
    initSignalR();
    
    return () => {
      signalRService.stop();
    };
  }, [token]);

  const handleConectar = async () => {
    setLoading(true);
    try {
      await conectar();
    } finally {
      setLoading(false);
    }
  };

  const handleDesconectar = async () => {
    setLoading(true);
    try {
      await desconectar();
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (estadoId: number) => {
    setLoading(true);
    try {
      await cambiarEstado(estadoId);
      setShowEstadoMenu(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const response = await apiService.obtenerUsuariosConectados();
      if (response.success && response.data) {
        setUsuariosConectados(response.data);
      }
    } catch (error) {
      console.error('Error actualizando usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const IconComponent = currentEstado?.icono ? iconMap[currentEstado.icono] : CheckCircle;
  const estadoColor = isConnected && currentEstado ? currentEstado.color : '#6B7280';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-10" />
      
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">Sistemas</h1>
                <p className="font-body text-sm text-slate-400">Control de Presencia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-body text-sm font-medium text-white">{usuario?.nombreCompleto}</p>
                <p className="font-body text-xs text-slate-400">{usuario?.cargo || usuario?.email}</p>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all font-body text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-up">
              <h2 className="font-display text-lg font-semibold text-white mb-6">Mi Estado</h2>
              
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{ 
                    backgroundColor: `${estadoColor}20`,
                    boxShadow: isConnected ? `0 0 20px ${estadoColor}30` : 'none'
                  }}
                >
                  {isConnected ? (
                    <IconComponent className="w-7 h-7" style={{ color: estadoColor }} />
                  ) : (
                    <XCircle className="w-7 h-7 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="font-body text-sm text-slate-400">Estado actual</p>
                  <p className="font-display text-xl font-semibold" style={{ color: estadoColor }}>
                    {isConnected && currentEstado ? currentEstado.nombre : 'Desconectado'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {!isConnected ? (
                  <button
                    onClick={handleConectar}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-body font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                    <span>Conectarse</span>
                  </button>
                ) : (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setShowEstadoMenu(!showEstadoMenu)}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white font-body flex items-center justify-between hover:bg-slate-700/50 transition-all"
                      >
                        <span className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: currentEstado?.color || '#22C55E' }} 
                          />
                          <span>Cambiar estado</span>
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showEstadoMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showEstadoMenu && (
                        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl z-20 animate-fade-in">
                          {estados.map((estado) => {
                            const EstadoIcon = iconMap[estado.icono || 'check-circle'] || CheckCircle;
                            return (
                              <button
                                key={estado.id}
                                onClick={() => handleCambiarEstado(estado.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left"
                              >
                                <EstadoIcon className="w-5 h-5" style={{ color: estado.color }} />
                                <span className="font-body text-white">{estado.nombre}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDesconectar}
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-body font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <PowerOff className="w-5 h-5" />
                      )}
                      <span>Desconectarse</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-lg font-semibold text-white mb-4">Mi Información</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <span className="font-body text-sm">{usuario?.email}</span>
                </div>
                {usuario?.telefono && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <span className="font-body text-sm">{usuario.telefono}</span>
                  </div>
                )}
                {usuario?.departamento && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Monitor className="w-5 h-5 text-slate-500" />
                    <span className="font-body text-sm">{usuario.departamento}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Equipo Conectado</h2>
                  <p className="font-body text-sm text-slate-400 mt-1">
                    {usuariosConectados.length} persona{usuariosConectados.length !== 1 ? 's' : ''} en línea
                  </p>
                </div>
                <button
                  onClick={refreshUsuarios}
                  disabled={loadingUsuarios}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <UsuariosConectadosPanel usuarios={usuariosConectados} loading={loadingUsuarios} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
