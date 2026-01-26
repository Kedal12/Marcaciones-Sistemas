import React, { useState, useEffect } from 'react';
import { 
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Users,
  Coffee,
  Phone,
  Mail,
  UserCircle,
  RefreshCw,
  Cpu,
  Wifi
} from 'lucide-react';
import apiService from '../services/api';
import signalRService from '../services/signalr';
import type { UsuarioConectado } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'minus-circle': MinusCircle,
  'clock': Clock,
  'users': Users,
  'coffee': Coffee,
};

function formatTiempoConectado(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

export function PublicDashboard() {
  const [usuarios, setUsuarios] = useState<UsuarioConectado[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await apiService.obtenerUsuariosConectados();
        if (response.success && response.data) {
          setUsuarios(response.data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsuarios();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchUsuarios, 30000);
    
    // Conectar SignalR
    const initSignalR = async () => {
      try {
        await signalRService.start();
        signalRService.onUsuariosActualizados((nuevoUsuarios) => {
          setUsuarios(nuevoUsuarios);
          setLastUpdate(new Date());
        });
      } catch (error) {
        console.error('Error conectando SignalR:', error);
      }
    };
    
    initSignalR();
    
    return () => {
      clearInterval(interval);
      signalRService.stop();
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await apiService.obtenerUsuariosConectados();
      if (response.success && response.data) {
        setUsuarios(response.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-10" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">Sistemas</h1>
                <p className="font-body text-sm text-slate-400">Panel de Presencia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="font-mono text-xs">
                  {lastUpdate.toLocaleTimeString('es-CO')}
                </span>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{usuarios.length}</p>
                <p className="font-body text-xs text-slate-400">Conectados</p>
              </div>
            </div>
          </div>
          
          {['Activo', 'Ocupado', 'Ausente'].map((estado) => {
            const count = usuarios.filter(u => u.estado === estado).length;
            const colors: Record<string, string> = {
              'Activo': 'text-green-400 bg-green-500/20',
              'Ocupado': 'text-red-400 bg-red-500/20',
              'Ausente': 'text-yellow-400 bg-yellow-500/20',
            };
            return (
              <div key={estado} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[estado]?.split(' ')[1]}`}>
                    <CheckCircle className={`w-5 h-5 ${colors[estado]?.split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-white">{count}</p>
                    <p className="font-body text-xs text-slate-400">{estado}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Grid */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="font-display text-lg font-semibold text-white mb-6">
            Equipo en Línea
          </h2>

          {loading && usuarios.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <p className="font-body text-slate-400">Cargando...</p>
              </div>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                Sin usuarios conectados
              </h3>
              <p className="font-body text-sm text-slate-400">
                No hay nadie del equipo conectado en este momento.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((usuario, index) => {
                const IconComponent = iconMap[usuario.iconoEstado || 'check-circle'] || CheckCircle;
                
                return (
                  <div
                    key={usuario.usuarioId}
                    className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border-2 border-slate-600/50">
                          {usuario.fotoUrl ? (
                            <img 
                              src={usuario.fotoUrl} 
                              alt={usuario.nombreCompleto}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div 
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center"
                          style={{ backgroundColor: usuario.colorEstado }}
                        >
                          <IconComponent className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-semibold text-white truncate">
                          {usuario.nombreCompleto}
                        </h3>
                        <p className="font-body text-xs text-slate-400 truncate">
                          {usuario.cargo || 'Sistemas'}
                        </p>
                        
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body mt-2"
                          style={{ 
                            backgroundColor: `${usuario.colorEstado}20`,
                            color: usuario.colorEstado
                          }}
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: usuario.colorEstado }}
                          />
                          {usuario.estado}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{usuario.email}</span>
                      </div>
                      {usuario.telefono && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{usuario.telefono}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTiempoConectado(usuario.minutosConectado)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-slate-500 text-sm font-body">
            Departamento de Sistemas © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
