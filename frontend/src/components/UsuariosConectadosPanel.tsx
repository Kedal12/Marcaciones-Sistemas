import React from 'react';
import { 
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Users,
  Coffee,
  Phone,
  Mail,
  Monitor,
  UserCircle
} from 'lucide-react';
import type { UsuarioConectado } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'minus-circle': MinusCircle,
  'clock': Clock,
  'users': Users,
  'coffee': Coffee,
};

interface Props {
  usuarios: UsuarioConectado[];
  loading: boolean;
}

function formatTiempoConectado(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

export function UsuariosConectadosPanel({ usuarios, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-icg-500/30 border-t-icg-500 rounded-full animate-spin" />
          <p className="font-body text-slate-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2">
          Sin usuarios conectados
        </h3>
        <p className="font-body text-sm text-slate-400 max-w-sm">
          Actualmente no hay nadie del equipo conectado. Sé el primero en conectarte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {usuarios.map((usuario, index) => {
        const IconComponent = iconMap[usuario.iconoEstado || 'check-circle'] || CheckCircle;
        
        return (
          <div
            key={usuario.usuarioId}
            className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar with status indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-icg-500/20 to-icg-700/20 flex items-center justify-center border-2 border-slate-600/50 group-hover:border-icg-500/50 transition-colors">
                  {usuario.fotoUrl ? (
                    <img 
                      src={usuario.fotoUrl} 
                      alt={usuario.nombreCompleto}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                {/* Status dot */}
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center"
                  style={{ backgroundColor: usuario.colorEstado }}
                >
                  <IconComponent className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-white truncate">
                      {usuario.nombreCompleto}
                    </h3>
                    <p className="font-body text-sm text-slate-400">
                      {usuario.cargo || 'Sin cargo asignado'}
                    </p>
                  </div>
                  
                  {/* Estado badge */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium flex-shrink-0"
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

                {/* Contact info */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="font-body truncate">{usuario.email}</span>
                  </div>
                  
                  {usuario.telefono && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="font-body">{usuario.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Connection info */}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-body">
                      Conectado hace {formatTiempoConectado(usuario.minutosConectado)}
                    </span>
                  </div>
                  
                  {usuario.nombreEquipo && (
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="font-body truncate">{usuario.nombreEquipo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
