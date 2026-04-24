/**
 * SSE Emitter — SplitWise Real-Time Engine
 * ==========================================
 * Singleton that manages all connected SSE clients and broadcasts events.
 * Each connected browser tab is a "client".
 *
 * Usage in any router:
 *   import { broadcast, broadcastToUser } from '../utils/sseEmitter.js';
 *   broadcast('expense:created', { id, userId, title, amount }); // all clients
 *   broadcastToUser(userId, 'notification:new', payload);        // one user
 */

import { EventEmitter } from 'events';

class SseEmitter extends EventEmitter {}
const emitter = new SseEmitter();
emitter.setMaxListeners(0); // no limit — one listener per connected tab

// Map: clientId → { res, userId }
const clients = new Map();
let nextId = 1;

// ─── Register a new SSE client ────────────────────────────────────────────────
export function addClient(res, userId) {
  const id = nextId++;
  clients.set(id, { res, userId: String(userId) });
  console.log(`SSE: client #${id} connected (user=${userId}) — total: ${clients.size}`);
  return id;
}

// ─── Remove a client (on disconnect) ─────────────────────────────────────────
export function removeClient(id) {
  clients.delete(id);
  console.log(`SSE: client #${id} disconnected — total: ${clients.size}`);
}

// ─── Broadcast to ALL connected clients ──────────────────────────────────────
export function broadcast(event, data) {
  const payload = formatEvent(event, data);
  let sent = 0;
  for (const [, client] of clients) {
    try {
      client.res.write(payload);
      sent++;
    } catch (_) {}
  }
  if (sent) console.log(`SSE: broadcast "${event}" → ${sent} client(s)`);
}

// ─── Broadcast to a specific user's sessions (all tabs) ──────────────────────
export function broadcastToUser(userId, event, data) {
  const uid = String(userId);
  const payload = formatEvent(event, data);
  let sent = 0;
  for (const [, client] of clients) {
    if (client.userId === uid) {
      try {
        client.res.write(payload);
        sent++;
      } catch (_) {}
    }
  }
  if (sent) console.log(`SSE: user "${uid}" event "${event}" → ${sent} tab(s)`);
}

// ─── Broadcast to a list of user IDs ─────────────────────────────────────────
export function broadcastToUsers(userIds, event, data) {
  const uids = new Set(userIds.map(String));
  const payload = formatEvent(event, data);
  let sent = 0;
  for (const [, client] of clients) {
    if (uids.has(client.userId)) {
      try {
        client.res.write(payload);
        sent++;
      } catch (_) {}
    }
  }
  if (sent) console.log(`SSE: multicast "${event}" → ${sent} client(s)`);
}

// ─── Format SSE message ───────────────────────────────────────────────────────
function formatEvent(event, data) {
  const json = JSON.stringify(data ?? {});
  return `event: ${event}\ndata: ${json}\n\n`;
}

// ─── Heartbeat — prevents proxy/load-balancer timeouts ───────────────────────
setInterval(() => {
  const ping = ': heartbeat\n\n';
  for (const [id, client] of clients) {
    try {
      client.res.write(ping);
    } catch (_) {
      clients.delete(id);
    }
  }
}, 25000);

export { emitter };
