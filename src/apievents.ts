import { EventSpewer, Timers } from 'detritus-utils';
import WebSocket from 'ws';

import { NotSoHeaders, RedisChannels } from './constants';
import { captureError } from './sentry';
import { RedisPayloads } from './types';


export const API_EVENTS_URL_DEFAULT = 'wss://gateway.nsb.gg/events';

// shaped like discord's, see the api's `GatewayOpcodes`
export enum ApiGatewayOpcodes {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  RESUME = 6,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11,
  // ours, the api asking our cluster something about one of its shards, answered with RESPONSE
  REQUEST = 12,
  RESPONSE = 13,
}

export enum ApiGatewayDispatchEvents {
  READY = 'READY',
  RESUMED = 'RESUMED',
}

export enum ApiGatewayRequestMethods {
  // `{guild_id, user_id}`, see `listeners/apirequests.ts`
  GUILD_MEMBER = 'GUILD_MEMBER',
  // `{user_id}`, sent to every cluster, see `listeners/apirequests.ts`
  USER_GUILDS = 'USER_GUILDS',
}

export enum ApiEventsCloseCodes {
  UNAUTHORIZED = 4001,
  DECODE_ERROR = 4002,
  ALREADY_AUTHENTICATED = 4005,
  SESSION_TIMED_OUT = 4009,
  INVALID_SHARD = 4010,
  // another connection identified with one of our shards
  SESSION_REPLACED = 4020,
}

export enum ApiEventsSpewerEvents {
  // the api asked us something (`ApiGatewayRequest`), whoever handles its method answers with `respond()`
  REQUEST = 'request',
  // events were missed (the api couldn't resume us, or we never had a sequence after a disconnect), anything cached and
  // kept up to date by events could be stale now
  RESYNC = 'resync',
}

// wait between reconnects, every attempt past the end uses the last one
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];
const RECONNECT_DELAY_MAX = RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
// every cluster drops at once when the api restarts, so spread the reconnects out by up to this much (or the delay
// itself, if longer) instead of all hitting it together
const RECONNECT_JITTER_MIN = 5000;
const HANDSHAKE_TIMEOUT = 15 * 1000;
// from the socket opening to READY/RESUMED (HELLO, then our IDENTIFY or RESUME)
const SESSION_TIMEOUT = 15 * 1000;
// what the api has to tell us in HELLO, at least
const HEARTBEAT_INTERVAL_MIN = 1000;
// answers made while we had no open connection are sent once one opens (the api takes them before IDENTIFY too), up to
// this many and only while the api could still be waiting for them
const PENDING_RESPONSES_MAX = 100;
const PENDING_RESPONSE_MAX_AGE = 15 * 1000;
// every cluster reconnects on its own, so only report a connection problem to sentry this often while it lasts
const SENTRY_REPORT_INTERVAL = 10 * 60 * 1000;


export interface ApiGatewayPayload {
  d: any,
  op: ApiGatewayOpcodes,
  // DISPATCH only, the stream id we resume after and the event's redis channel
  s?: null | string,
  t?: null | string,
}

export interface ApiGatewayRequest {
  data: any,
  method: string,
  nonce: string,
}

export interface ApiEventsShards {
  shardCount: number,
  shardEnd: number,
  shardStart: number,
}


// live events from the api (settings/tags/reminders changes) over its gateway, the api replays anything we missed when
// we RESUME with the last sequence we handled. it also asks us things about our shards (`REQUEST`)
// what the api's `RedisChannels` look like
const API_EVENT_CHANNEL = /^[A-Z][A-Z0-9_]{0,63}$/;

export class ApiEventsSpewer extends EventSpewer {
  ended: boolean = false;
  // the api answered our last heartbeat, one still unanswered when the next is due means the connection is dead
  heartbeatAcked: boolean = true;
  heartbeatInterval = new Timers.Interval();
  // last stream id we handled, sent as `seq` when resuming and with every heartbeat
  lastId: null | string = null;
  lastReportedAt: number = 0;
  // a connection dropped while we had no sequence, so the next connection can't replay what we missed
  missedEvents: boolean = false;
  pendingResponses: Array<{createdAt: number, d: any}> = [];
  reconnectAttempts: number = 0;
  reconnectTimeout = new Timers.Timeout();
  // the api couldn't resume the current connection, we already resynced for it
  resynced: boolean = false;
  sessionTimeout = new Timers.Timeout();
  // which shards our cluster has, sent with IDENTIFY/RESUME so the api sends us the requests for them
  shards: ApiEventsShards | null = null;
  socket: null | WebSocket = null;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.heartbeatInterval.unref();
    this.reconnectTimeout.unref();
    this.sessionTimeout.unref();
  }

  // connects once the cluster's shards are known and its listeners/stores are subscribed, so no event goes unheard
  start(shards: ApiEventsShards): void {
    if (!this.shards) {
      this.shards = shards;
      this.connect();
    }
  }

  connect(): void {
    if (this.ended || !this.shards) {
      return;
    }
    this.reconnectTimeout.stop();
    this.cleanupSocket();

    let socket: WebSocket;
    try {
      const url = new URL(this.url);

      const headers: Record<string, string> = {};
      const token = process.env.NOTSOBOT_API_TOKEN;
      if (token) {
        headers[NotSoHeaders.AUTHORIZATION] = `Bot ${token}`;
      }

      socket = new WebSocket(url.href, {handshakeTimeout: HANDSHAKE_TIMEOUT, headers});
    } catch(error) {
      // bad url, retrying won't fix it but keeps us from crashing the cluster
      this.reportError(error);
      this.scheduleReconnect(RECONNECT_DELAY_MAX);
      return;
    }

    this.socket = socket;
    this.resynced = false;

    let handshakeStatusCode: null | number = null;
    socket.on('unexpected-response', (request, response) => {
      // non-101 response, like a 401 for a bad token. handle it ourselves to keep the status code
      handshakeStatusCode = response.statusCode || 0;
      response.resume();
      socket.terminate();
    });
    socket.on('open', () => {
      this.flushPendingResponses();
      this.sessionTimeout.start(SESSION_TIMEOUT, () => {
        if (socket === this.socket) {
          console.warn(`Api events connection wasn't ready after ${SESSION_TIMEOUT}ms, reconnecting`);
          // emits close, which reconnects
          socket.terminate();
        }
      });
    });
    socket.on('message', (data, isBinary) => {
      if (socket === this.socket && !isBinary) {
        this.onMessage(data.toString());
      }
    });
    socket.on('error', (error) => {
      if (socket !== this.socket || handshakeStatusCode !== null) {
        // a failed handshake is reported on close with its status code
        return;
      }
      this.reportError(error);
    });
    socket.on('close', (code, reason) => {
      this.onClose(socket, code, reason.toString(), handshakeStatusCode);
    });
  }

  end(): void {
    if (!this.ended) {
      this.ended = true;
      this.reconnectTimeout.stop();
      this.cleanupSocket();
    }
  }

  cleanupSocket(): void {
    const socket = this.socket;
    if (socket) {
      this.socket = null;
      this.heartbeatInterval.stop();
      this.sessionTimeout.stop();
      socket.removeAllListeners();
      // closing while connecting emits an error, without a listener it'd be thrown
      socket.on('error', () => {});
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000);
      } else {
        socket.terminate();
      }
    }
  }

  // whether it went out, nothing is sent without an open connection
  send(op: ApiGatewayOpcodes, d: any): boolean {
    const socket = this.socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({op, d}));
      return true;
    }
    return false;
  }

  startHeartbeating(interval: number): void {
    const socket = this.socket;
    this.heartbeatAcked = true;
    this.heartbeatInterval.start(interval, () => {
      if (socket !== this.socket || !socket) {
        return;
      }
      if (!this.heartbeatAcked) {
        console.warn('Api events connection never acked our last heartbeat, reconnecting');
        // emits close, which reconnects
        socket.terminate();
        return;
      }
      this.heartbeatAcked = false;
      this.send(ApiGatewayOpcodes.HEARTBEAT, this.lastId);
    });
  }

  identify(): void {
    const { shardCount, shardEnd, shardStart } = this.shards as ApiEventsShards;
    const d = {shard_count: shardCount, shards: [shardStart, shardEnd]};
    if (this.lastId) {
      this.send(ApiGatewayOpcodes.RESUME, {...d, seq: this.lastId});
    } else {
      this.send(ApiGatewayOpcodes.IDENTIFY, d);
    }
  }

  onSessionReady(): void {
    this.sessionTimeout.stop();
    this.missedEvents = false;
    this.reconnectAttempts = 0;
    this.lastReportedAt = 0;
  }

  // answers an `ApiEventsSpewerEvents.REQUEST`, `error` is a short code (`UNAVAILABLE`), the api then asks discord
  respond(request: ApiGatewayRequest, data: any, error?: string): void {
    const d = {
      data: (data === undefined) ? null : data,
      error: error || null,
      method: request.method,
      nonce: request.nonce,
    };
    if (!this.send(ApiGatewayOpcodes.RESPONSE, d)) {
      this.pendingResponses.push({createdAt: Date.now(), d});
      if (PENDING_RESPONSES_MAX < this.pendingResponses.length) {
        this.pendingResponses.shift();
      }
    }
  }

  flushPendingResponses(): void {
    const pending = this.pendingResponses;
    this.pendingResponses = [];
    const now = Date.now();
    for (let { createdAt, d } of pending) {
      if (now - createdAt <= PENDING_RESPONSE_MAX_AGE) {
        this.send(ApiGatewayOpcodes.RESPONSE, d);
      }
    }
  }

  onClose(socket: WebSocket, code: number, reason: string, handshakeStatusCode: null | number): void {
    if (socket !== this.socket) {
      return;
    }
    this.socket = null;
    this.heartbeatInterval.stop();
    this.sessionTimeout.stop();
    if (!this.lastId) {
      this.missedEvents = true;
    }
    if (this.ended) {
      return;
    }

    let delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempts++;

    if (code === ApiEventsCloseCodes.SESSION_REPLACED) {
      // only our current connection gets here, an older one being replaced by it is ignored above
      this.reportError(new Error('Api events connection replaced, another connection identified with our shards'));
    } else if (code === ApiEventsCloseCodes.UNAUTHORIZED || handshakeStatusCode === 401) {
      // bad token, it won't fix itself soon so don't hammer the api
      delay = RECONNECT_DELAY_MAX;
      this.reportError(new Error(`Api events connection unauthorized (${(handshakeStatusCode) ? `status ${handshakeStatusCode}` : `close code ${code}`}), check NOTSOBOT_API_TOKEN`));
    } else if (handshakeStatusCode !== null) {
      this.reportError(new Error(`Api events connection handshake failed with status ${handshakeStatusCode}`));
    }

    const wait = this.scheduleReconnect(delay);
    console.warn(`Api events connection closed (${code}${(reason) ? `, ${reason}` : ''}), reconnecting in ${wait}ms`);
  }

  // returns how long it'll actually wait, with the jitter
  scheduleReconnect(delay: number): number {
    if (this.ended) {
      return 0;
    }
    const wait = delay + Math.floor(Math.random() * Math.max(delay, RECONNECT_JITTER_MIN));
    this.reconnectTimeout.start(wait, () => this.connect());
    return wait;
  }

  onMessage(raw: string): void {
    let payload: ApiGatewayPayload;
    try {
      payload = JSON.parse(raw);
    } catch(error) {
      captureError(error, {tags: {source: 'api_events'}});
      return;
    }
    if (!payload || typeof(payload) !== 'object') {
      return;
    }

    switch (payload.op) {
      case ApiGatewayOpcodes.HELLO: {
        const interval = (payload.d) ? payload.d.heartbeat_interval : null;
        this.startHeartbeating((typeof(interval) === 'number') ? Math.max(interval, HEARTBEAT_INTERVAL_MIN) : HEARTBEAT_INTERVAL_MIN);
        this.identify();
      }; break;
      case ApiGatewayOpcodes.HEARTBEAT_ACK: {
        this.heartbeatAcked = true;
        // the newest stream id the api read for us, past events that went to other clusters (sent after anything
        // before it that was for us)
        if (typeof(payload.d) === 'string') {
          this.lastId = payload.d;
        }
      }; break;
      case ApiGatewayOpcodes.INVALID_SESSION: {
        // what we missed is gone, start from the newest event and drop anything cached
        this.lastId = null;
        this.resynced = true;
        this.emitResync();
        this.identify();
      }; break;
      case ApiGatewayOpcodes.DISPATCH: {
        this.onDispatch(payload.t, payload.s, payload.d);
      }; break;
      case ApiGatewayOpcodes.REQUEST: {
        this.onRequest(payload.d);
      }; break;
    }
  }

  onDispatch(name: any, sequence: any, data: any): void {
    switch (name) {
      case ApiGatewayDispatchEvents.READY: {
        // a fresh connection after a disconnect can't replay anything, so treat it like the api couldn't resume us
        if (!this.resynced && this.missedEvents) {
          this.emitResync();
        }
        this.onSessionReady();
      }; break;
      case ApiGatewayDispatchEvents.RESUMED: {
        this.onSessionReady();
      }; break;
      default: {
        // any channel shaped like the api's (`GUILD_REPORT_MESSAGE_CREATE`), not just the ones in `RedisChannels`: this module
        // is never reloaded by `refresh`, so its copy of the enum would drop channels added since the bot started (and
        // the reloaded listeners waiting on them would never hear a thing). the shape keeps out the spewer's own events
        if (typeof(name) === 'string' && API_EVENT_CHANNEL.test(name)) {
          try {
            this.emit(name, (data === undefined) ? null : data);
          } catch(error) {
            captureError(error, {tags: {'api_events.channel': name, source: 'api_events'}});
          }
        }
      };
    }
    if (typeof(sequence) === 'string') {
      this.lastId = sequence;
    }
  }

  onRequest(data: any): void {
    if (!data || typeof(data.nonce) !== 'string' || typeof(data.method) !== 'string') {
      return;
    }
    const request: ApiGatewayRequest = {data: data.data, method: data.method, nonce: data.nonce};
    // between `refresh` stopping the listeners and connecting the reloaded ones, answer right away instead of the api
    // waiting out its timeout
    if (!this.hasEventListener(ApiEventsSpewerEvents.REQUEST)) {
      this.respond(request, null, 'UNHANDLED');
      return;
    }
    try {
      this.emit(ApiEventsSpewerEvents.REQUEST, request);
    } catch(error) {
      captureError(error, {tags: {'api_events.method': request.method, source: 'api_events'}});
      this.respond(request, null, 'ERROR');
    }
  }

  emitResync(): void {
    console.warn('Api events were missed, resyncing caches');
    try {
      this.emit(ApiEventsSpewerEvents.RESYNC);
    } catch(error) {
      captureError(error, {tags: {'api_events.channel': ApiEventsSpewerEvents.RESYNC, source: 'api_events'}});
    }
  }

  reportError(error: any): void {
    console.error('Api events connection error', error);
    const now = Date.now();
    if (SENTRY_REPORT_INTERVAL <= now - this.lastReportedAt) {
      this.lastReportedAt = now;
      captureError(error, {level: 'warning', tags: {source: 'api_events.connection'}});
    }
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ApiEventsSpewerEvents.REQUEST, listener: (request: ApiGatewayRequest) => any): this;
  on(event: ApiEventsSpewerEvents.RESYNC, listener: () => any): this;
  on(event: RedisChannels.GUILD_REPORT_MESSAGE_CREATE, listener: (payload: RedisPayloads.GuildReportMessageCreate) => any): this;
  on(event: RedisChannels.GUILD_REPORT_UPDATE, listener: (payload: RedisPayloads.GuildReportUpdate) => any): this;
  on(event: RedisChannels.GUILD_SETTINGS_UPDATE, listener: (payload: RedisPayloads.GuildSettingsUpdate) => any): this;
  on(event: RedisChannels.GUILD_WARNING_DELETE, listener: (payload: RedisPayloads.GuildWarningDelete) => any): this;
  on(event: RedisChannels.GUILD_WARNING_DELETE_BULK, listener: (payload: RedisPayloads.GuildWarningDeleteBulk) => any): this;
  on(event: RedisChannels.MUSIC_CONTROL, listener: (payload: RedisPayloads.MusicControl) => any): this;
  on(event: RedisChannels.PREMIUM_SERVERS_UPDATE, listener: (payload: RedisPayloads.PremiumServersUpdate) => any): this;
  on(event: RedisChannels.REMINDER_CREATE, listener: (payload: RedisPayloads.ReminderCreate) => any): this;
  on(event: RedisChannels.REMINDER_DELETE, listener: (payload: RedisPayloads.ReminderDelete) => any): this;
  on(event: RedisChannels.REMINDER_UPDATE, listener: (payload: RedisPayloads.ReminderUpdate) => any): this;
  on(event: RedisChannels.REPORT_MESSAGE_CREATE, listener: (payload: RedisPayloads.ReportMessageCreate) => any): this;
  on(event: RedisChannels.TIMED_BAN_CREATE, listener: (payload: RedisPayloads.TimedBanCreate) => any): this;
  on(event: RedisChannels.TIMED_BAN_DELETE, listener: (payload: RedisPayloads.TimedBanDelete) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}

export default new ApiEventsSpewer(process.env.NOTSOBOT_GATEWAY_URL || API_EVENTS_URL_DEFAULT);
