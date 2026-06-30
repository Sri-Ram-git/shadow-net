import type { WebSocketMessage } from '../types';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
    this.isConnecting = true;

    const envWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (envWsUrl) {
      try { this.ws = new WebSocket(envWsUrl); this.isConnecting = false; return; } catch { /* fall through */ }
    }
    const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
    const apiUrl = envApiUrl || 'https://shadownet-api-production-bdf0.up.railway.app/api';
    const base = apiUrl.replace(/^http/, 'ws').replace(/\/+$/, '');
    const apiSuffix = base.endsWith('/api') ? '' : '/api';
    try { this.ws = new WebSocket(`${base}${apiSuffix}/ws`); this.isConnecting = false; return; } catch { /* fall through */ }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/ws`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handlers.forEach((handler) => handler(message));
      } catch { /* ignore parse errors */ }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
      this.ws?.close();
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}

export const wsService = new WebSocketService();
