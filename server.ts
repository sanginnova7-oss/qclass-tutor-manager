import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = http.createServer(app);

// Data directory for persistent server-side storage
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'qclass-realtime-db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory server-authoritative state
let serverState: Record<string, any> = {};

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    serverState = JSON.parse(raw);
    console.log('[Realtime Server] Loaded state from disk successfully.');
  } catch (err) {
    console.error('[Realtime Server] Error loading state from disk:', err);
  }
}

// Debounced file persistence
let saveTimer: NodeJS.Timeout | null = null;
function persistServerState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
      console.log('[Realtime Server] State successfully persisted to disk.');
    } catch (e) {
      console.error('[Realtime Server] Failed to persist state:', e);
    }
  }, 1000);
}

app.use(express.json({ limit: '50mb' }));

// Setup WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

interface ClientSession {
  id: string;
  ws: WebSocket;
  userName?: string;
  role?: string;
  connectedAt: string;
  isAlive: boolean;
}

const clients = new Map<string, ClientSession>();

function broadcast(payload: any, excludeClientId?: string) {
  const jsonStr = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!excludeClientId || (client as any).clientId !== excludeClientId) {
        client.send(jsonStr);
      }
    }
  });
}

function broadcastPresence() {
  const clientList = Array.from(clients.values()).map((c) => ({
    id: c.id,
    userName: c.userName || 'Người dùng QClass',
    role: c.role || 'teacher',
    connectedAt: c.connectedAt,
  }));

  broadcast({
    type: 'PRESENCE_UPDATE',
    count: clients.size,
    clients: clientList,
    timestamp: new Date().toISOString(),
  });
}

// Heartbeat ping interval every 25s
const heartbeatInterval = setInterval(() => {
  clients.forEach((client, id) => {
    if (!client.isAlive) {
      client.ws.terminate();
      clients.delete(id);
      broadcastPresence();
      return;
    }
    client.isAlive = false;
    client.ws.ping();
  });
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (ws) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  (ws as any).clientId = clientId;

  const session: ClientSession = {
    id: clientId,
    ws,
    connectedAt: new Date().toISOString(),
    isAlive: true,
  };
  clients.set(clientId, session);

  ws.on('pong', () => {
    session.isAlive = true;
  });

  // Send initial handshake
  ws.send(
    JSON.stringify({
      type: 'WELCOME',
      clientId,
      serverTime: new Date().toISOString(),
      hasInitialState: Object.keys(serverState).length > 0,
      serverState: Object.keys(serverState).length > 0 ? serverState : null,
      connectedClientsCount: clients.size,
    })
  );

  broadcastPresence();

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      session.isAlive = true;

      switch (message.type) {
        case 'IDENTIFY': {
          session.userName = message.userName;
          session.role = message.role;
          broadcastPresence();
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', clientTime: message.clientTime, serverTime: Date.now() }));
          break;
        }

        case 'SYNC_STATE': {
          if (message.state && typeof message.state === 'object') {
            serverState = { ...serverState, ...message.state };
            persistServerState();

            // Broadcast to other clients
            broadcast(
              {
                type: 'STATE_UPDATED',
                originClientId: clientId,
                source: message.source || 'client_sync',
                state: message.state,
                timestamp: new Date().toISOString(),
              },
              clientId
            );
          }
          break;
        }

        case 'MUTATION': {
          const { entity, action, data, eventNotification } = message;
          if (entity && Array.isArray(serverState[entity])) {
            if (action === 'create' || action === 'add') {
              serverState[entity] = [data, ...serverState[entity].filter((i: any) => i.id !== data.id)];
            } else if (action === 'update') {
              serverState[entity] = serverState[entity].map((i: any) =>
                i.id === data.id ? { ...i, ...data } : i
              );
            } else if (action === 'delete') {
              serverState[entity] = serverState[entity].filter((i: any) => i.id !== data.id);
            }
            persistServerState();
          }

          // Broadcast mutation
          broadcast(
            {
              type: 'MUTATION_BROADCAST',
              originClientId: clientId,
              entity,
              action,
              data,
              eventNotification,
              timestamp: new Date().toISOString(),
            },
            clientId
          );
          break;
        }

        case 'REALTIME_EVENT': {
          broadcast({
            type: 'REALTIME_EVENT',
            originClientId: clientId,
            event: message.event,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Realtime Server] Error parsing WS payload:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcastPresence();
  });

  ws.on('error', (err) => {
    console.error(`[Realtime Server] WS Client ${clientId} error:`, err);
    clients.delete(clientId);
    broadcastPresence();
  });
});

// REST API Endpoints
app.get('/api/realtime/status', (_req, res) => {
  res.json({
    status: 'online',
    connectedClients: clients.size,
    hasServerState: Object.keys(serverState).length > 0,
    serverTime: new Date().toISOString(),
    keys: Object.keys(serverState),
  });
});

app.get('/api/realtime/state', (_req, res) => {
  res.json({
    success: true,
    serverState,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/realtime/sync', (req, res) => {
  try {
    const { state, source, clientId } = req.body;
    if (state && typeof state === 'object') {
      serverState = { ...serverState, ...state };
      persistServerState();
      broadcast(
        {
          type: 'STATE_UPDATED',
          originClientId: clientId || 'http_api',
          source: source || 'rest_api',
          state,
          timestamp: new Date().toISOString(),
        },
        clientId
      );
      return res.json({ success: true, count: Object.keys(serverState).length });
    }
    return res.status(400).json({ success: false, error: 'Invalid state format' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/realtime/broadcast', (req, res) => {
  try {
    const { event, clientId } = req.body;
    if (event) {
      broadcast({
        type: 'REALTIME_EVENT',
        originClientId: clientId || 'http_api',
        event,
        timestamp: new Date().toISOString(),
      });
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, error: 'No event provided' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware in dev or static serving in production
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Realtime Server] QClass running on http://0.0.0.0:${PORT} (WS on /ws)`);
});
