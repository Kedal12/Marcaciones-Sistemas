import * as signalR from '@microsoft/signalr';
import type { UsuarioConectado } from '../types';

type ConnectionCallback = (usuarios: UsuarioConectado[]) => void;
type StatusCallback = (connected: boolean) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: ConnectionCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private manualStop: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentToken: string | undefined;

  async start(token?: string): Promise<void> {
    this.manualStop = false;
    this.currentToken = token;

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // Limpiar conexión anterior si existe
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        // Ignorar
      }
      this.connection = null;
    }

    const hubUrl = 'http://10.15.0.221:5000/hubs/presencia';
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        // Configurar transporte con fallback
        transport: signalR.HttpTransportType.WebSockets | 
                   signalR.HttpTransportType.ServerSentEvents | 
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Reintentar: 0s, 2s, 5s, 10s, 30s, luego cada 30s
          const delays = [0, 2000, 5000, 10000, 30000];
          return delays[retryContext.previousRetryCount] ?? 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Configurar timeout del servidor más largo (30 minutos)
    this.connection.serverTimeoutInMilliseconds = 30 * 60 * 1000;
    this.connection.keepAliveIntervalInMilliseconds = 15 * 1000;

    this.connection.on('UsuariosActualizados', (usuarios: UsuarioConectado[]) => {
      this.callbacks.forEach(callback => callback(usuarios));
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR: Reconectando...');
      this.notifyStatus(false);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR: Reconectado');
      this.notifyStatus(true);
    });

    this.connection.onclose((error) => {
      console.log('SignalR: Conexión cerrada', error);
      this.notifyStatus(false);
      
      // Si no fue un cierre manual, intentar reconectar
      if (!this.manualStop) {
        this.scheduleReconnect();
      }
    });

    try {
      await this.connection.start();
      console.log('SignalR: Conectado');
      this.notifyStatus(true);
    } catch (err) {
      console.error('SignalR: Error al conectar', err);
      // Intentar reconectar después de un fallo
      if (!this.manualStop) {
        this.scheduleReconnect();
      }
      throw err;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(async () => {
      if (!this.manualStop) {
        console.log('SignalR: Intentando reconexión manual...');
        try {
          await this.start(this.currentToken);
        } catch (e) {
          console.error('SignalR: Reconexión manual falló, reintentando en 30s...');
          this.scheduleReconnect();
        }
      }
    }, 30000);
  }

  private notifyStatus(connected: boolean) {
    this.statusCallbacks.forEach(cb => cb(connected));
  }

  async stop(): Promise<void> {
    this.manualStop = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        // Ignorar errores al detener
      }
      this.connection = null;
    }
  }

  onUsuariosActualizados(callback: ConnectionCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
