/**
 * Real-time synchronization service for QClass Tutor Manager
 * Supports WebSocket bi-directional live sync + Multi-tab BroadcastChannel
 */

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface RealtimeEvent {
  id: string;
  type: 'attendance' | 'payment' | 'student' | 'test' | 'lead' | 'note' | 'system';
  title: string;
  description: string;
  timestamp: string;
  authorName?: string;
  badge?: string;
}

export interface RealtimePresenceUser {
  id: string;
  userName: string;
  role: string;
  connectedAt: string;
}

export interface RealtimeState {
  status: RealtimeStatus;
  latencyMs: number;
  connectedClientsCount: number;
  connectedClients: RealtimePresenceUser[];
  lastSyncTime: string | null;
  clientId: string | null;
  soundEnabled: boolean;
}

type StatusListener = (state: RealtimeState) => void;
type EventListener = (event: RealtimeEvent) => void;
type RemoteStateListener = (state: any, source: string) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private clientId: string = `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  private status: RealtimeStatus = 'disconnected';
  private latencyMs: number = 0;
  private connectedClientsCount: number = 1;
  private connectedClients: RealtimePresenceUser[] = [];
  private lastSyncTime: string | null = null;
  private soundEnabled: boolean = true;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isApplyingRemoteUpdate = false;
  private syncDebounceTimer: any = null;

  private statusListeners = new Set<StatusListener>();
  private eventListeners = new Set<EventListener>();
  private remoteStateListeners = new Set<RemoteStateListener>();

  constructor() {
    this.initBroadcastChannel();
    // Load sound preference
    try {
      const soundPref = localStorage.getItem('qclass_realtime_sound');
      if (soundPref !== null) {
        this.soundEnabled = soundPref === 'true';
      }
    } catch {
      // ignore
    }
  }

  // --- BROADCAST CHANNEL (Multi-tab local real-time sync) ---
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('qclass_realtime_bus');
        this.channel.onmessage = (event) => {
          const msg = event.data;
          if (!msg || msg.originClientId === this.clientId) return;

          if (msg.type === 'TAB_MUTATION' || msg.type === 'TAB_STATE') {
            this.handleRemoteStateUpdate(msg.state, 'tab_channel');
          } else if (msg.type === 'TAB_EVENT') {
            this.handleIncomingEvent(msg.event, false);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed to initialize', e);
      }
    }
  }

  // --- WEBSOCKET CONNECTION ---
  public connect(userName?: string, role?: string) {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');

        // Identify client
        this.send({
          type: 'IDENTIFY',
          clientId: this.clientId,
          userName: userName || 'Giáo viên QClass',
          role: role || 'teacher',
        });

        // Start ping latency check
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[Realtime] Failed to parse message', e);
        }
      };

      this.ws.onclose = () => {
        this.stopPingLoop();
        this.updateStatus('disconnected');
        this.scheduleReconnect(userName, role);
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime] WebSocket error', err);
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      console.warn('[Realtime] Failed to establish WebSocket connection', e);
      this.updateStatus('disconnected');
      this.scheduleReconnect(userName, role);
    }
  }

  private scheduleReconnect(userName?: string, role?: string) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect(userName, role);
    }, delay);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', clientTime: Date.now() });
      }
    }, 15000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'WELCOME': {
        this.clientId = msg.clientId || this.clientId;
        this.connectedClientsCount = msg.connectedClientsCount || 1;
        this.lastSyncTime = new Date().toISOString();
        if (msg.hasInitialState && msg.serverState) {
          this.handleRemoteStateUpdate(msg.serverState, 'server_init');
        }
        this.notifyStatus();
        break;
      }

      case 'PONG': {
        if (msg.clientTime) {
          this.latencyMs = Math.max(1, Date.now() - msg.clientTime);
          this.notifyStatus();
        }
        break;
      }

      case 'PRESENCE_UPDATE': {
        this.connectedClientsCount = msg.count || 1;
        this.connectedClients = msg.clients || [];
        this.notifyStatus();
        break;
      }

      case 'STATE_UPDATED': {
        if (msg.originClientId !== this.clientId && msg.state) {
          this.handleRemoteStateUpdate(msg.state, msg.source || 'server_broadcast');
        }
        break;
      }

      case 'MUTATION_BROADCAST': {
        if (msg.originClientId !== this.clientId) {
          if (msg.eventNotification) {
            this.handleIncomingEvent(msg.eventNotification, true);
          }
        }
        break;
      }

      case 'REALTIME_EVENT': {
        if (msg.event) {
          const isRemote = msg.originClientId !== this.clientId;
          this.handleIncomingEvent(msg.event, isRemote);
        }
        break;
      }

      default:
        break;
    }
  }

  private handleRemoteStateUpdate(state: any, source: string) {
    if (this.isApplyingRemoteUpdate) return;
    this.isApplyingRemoteUpdate = true;
    try {
      this.lastSyncTime = new Date().toISOString();
      this.remoteStateListeners.forEach((listener) => listener(state, source));
      this.notifyStatus();
    } finally {
      this.isApplyingRemoteUpdate = false;
    }
  }

  private handleIncomingEvent(event: RealtimeEvent, playSound: boolean) {
    this.eventListeners.forEach((listener) => listener(event));
    if (playSound && this.soundEnabled) {
      this.playNotificationChime();
    }
  }

  // --- OUTBOUND BROADCAST (Called by db.ts when any data changes) ---
  public broadcastLocalChange(fullState: any, event?: RealtimeEvent) {
    if (this.isApplyingRemoteUpdate) return;

    this.lastSyncTime = new Date().toISOString();

    // 1. Multi-tab BroadcastChannel (Zero network latency)
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'TAB_STATE',
          originClientId: this.clientId,
          state: fullState,
          timestamp: this.lastSyncTime,
        });
        if (event) {
          this.channel.postMessage({
            type: 'TAB_EVENT',
            originClientId: this.clientId,
            event,
          });
        }
      } catch (e) {
        console.warn('Channel postMessage error', e);
      }
    }

    // 2. Debounced WebSocket state sync to prevent network congestion
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'SYNC_STATE',
          clientId: this.clientId,
          state: fullState,
        });
        if (event) {
          this.send({
            type: 'REALTIME_EVENT',
            clientId: this.clientId,
            event,
          });
        }
      } else {
        // Fallback HTTP sync if WS is not connected
        fetch('/api/realtime/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: fullState, clientId: this.clientId }),
        }).catch(() => {});
      }
    }, 400);

    this.notifyStatus();
  }

  // Dispatch a standalone real-time alert event (e.g., student took test, payment made)
  public dispatchEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>) {
    const fullEvent: RealtimeEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // Broadcast across tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'TAB_EVENT',
          originClientId: this.clientId,
          event: fullEvent,
        });
      } catch {}
    }

    // Broadcast through WebSocket
    this.send({
      type: 'REALTIME_EVENT',
      clientId: this.clientId,
      event: fullEvent,
    });

    // Notify local listeners
    this.handleIncomingEvent(fullEvent, false);
  }

  // --- AUDIO SYNTHESIS CHIME ---
  public playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Harmonic 2-tone chime: 587.33Hz (D5) -> 880Hz (A5)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.48);
    } catch {
      // Audio might be blocked until user interaction
    }
  }

  public toggleSound(enabled?: boolean) {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    try {
      localStorage.setItem('qclass_realtime_sound', String(this.soundEnabled));
    } catch {}
    this.notifyStatus();
    return this.soundEnabled;
  }

  // --- SUBSCRIPTIONS ---
  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getState());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public onRemoteState(listener: RemoteStateListener): () => void {
    this.remoteStateListeners.add(listener);
    return () => {
      this.remoteStateListeners.delete(listener);
    };
  }

  public getState(): RealtimeState {
    return {
      status: this.status,
      latencyMs: this.latencyMs,
      connectedClientsCount: this.connectedClientsCount,
      connectedClients: this.connectedClients,
      lastSyncTime: this.lastSyncTime,
      clientId: this.clientId,
      soundEnabled: this.soundEnabled,
    };
  }

  private updateStatus(newStatus: RealtimeStatus) {
    this.status = newStatus;
    this.notifyStatus();
  }

  private notifyStatus() {
    const s = this.getState();
    this.statusListeners.forEach((l) => l(s));
  }

  // Force sync from server via HTTP
  public async forcePullFromServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/realtime/state');
      if (res.ok) {
        const data = await res.json();
        if (data.serverState && Object.keys(data.serverState).length > 0) {
          this.handleRemoteStateUpdate(data.serverState, 'manual_pull');
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to pull from server', e);
      return false;
    }
  }
}

export const realtimeService = new RealtimeService();
