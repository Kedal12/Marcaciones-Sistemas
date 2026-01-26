import * as signalR from '@microsoft/signalr';
import type { UsuarioConectado } from '../types';

type ConnectionCallback = (usuarios: UsuarioConectado[]) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: ConnectionCallback[] = [];

  async start(token?: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const hubUrl = 'http://10.15.0.221:5000/hubs/presencia';
    
    let connectionBuilder = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information);

    this.connection = connectionBuilder.build();

    this.connection.on('UsuariosActualizados', (usuarios: UsuarioConectado[]) => {
      this.callbacks.forEach(callback => callback(usuarios));
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR: Reconectando...');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR: Reconectado');
    });

    this.connection.onclose(() => {
      console.log('SignalR: Conexión cerrada');
    });

    try {
      await this.connection.start();
      console.log('SignalR: Conectado');
    } catch (err) {
      console.error('SignalR: Error al conectar', err);
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  onUsuariosActualizados(callback: ConnectionCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
