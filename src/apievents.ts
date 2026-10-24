import { EventSpewer, Timers } from 'detritus-utils';
import WebSocket from 'ws';

import { NotSoHeaders, RedisChannels } from './constants';
import { captureError } from './sentry';
import { RedisPayloads } from './types';


export const API_EVENTS_URL_DEFAULT = 'wss://gateway.nsb.gg/events';

export enum ApiEventsCloseCodes {
  UNAUTHORIZED = 4001,
}

export enum ApiEventsSpewerEvents {
  // events were missed (our resume id was too old, or we never had one after a disconnect), anything cached and kept
  // up to date by events could be stale now
  RESYNC = 'resync',
}

// wait between reconnects, every attempt past the end uses the last one
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];
const RECONNECT_DELAY_MAX = RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
// every cluster drops at once when the api restarts, so spread the reconnects out by up to this much (or the delay
// itself, if longer) instead of all hitting it together
const RECONNECT_JITTER_MIN = 5000;
// the server pings every ~20 seconds, nothing for this long means the connection is dead
const HEARTBEAT_TIMEOUT = 60 * 1000;
const HANDSHAKE_TIMEOUT = 15 * 1000;
// every cluster reconnects on its own, so only report a connection problem to sentry this often while it lasts
const SENTRY_REPORT_INTERVAL = 10 * 60 * 1000;


export type ApiEventsPayload = {
  type: 'event',
  channel: string,
  data: any,
  id: string,
} | {
  type: 'ready',
  id: string,
} | {
  type: 'resync',
};


// live events from the api (settings/tags/reminders changes), the api replays anything we missed when we reconnect with
// the last id we handled
export class ApiEventsSpewer extends EventSpewer {
  ended: boolean = false;
  heartbeatTimeout = new Timers.Timeout();
  // last stream id we handled, sent as `after` when reconnecting
  lastId: null | string = null;
  lastReportedAt: number = 0;
  // a connection dropped while we had no resume id, so the next connection can't replay what we missed
  missedEvents: boolean = false;
  reconnectAttempts: number = 0;
  reconnectTimeout = new Timers.Timeout();
  // whether the current connection was made with a resume id, and if the server told us to resync on it
  resumed: boolean = false;
  resynced: boolean = false;
  socket: null | WebSocket = null;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.heartbeatTimeout.unref();
    this.reconnectTimeout.unref();
    this.connect();
  }

  connect(): void {
    if (this.ended) {
      return;
    }
    this.reconnectTimeout.stop();
    this.cleanupSocket();

    let socket: WebSocket;
    try {
      const url = new URL(this.url);
      if (this.lastId) {
        url.searchParams.set('after', this.lastId);
      }

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
    this.resumed = !!this.lastId;
    this.resynced = false;

    let handshakeStatusCode: null | number = null;
    socket.on('unexpected-response', (request, response) => {
      // non-101 response, like a 401 for a bad token. handle it ourselves to keep the status code
      handshakeStatusCode = response.statusCode || 0;
      response.resume();
      socket.terminate();
    });
    socket.on('open', () => this.resetHeartbeat(socket));
    socket.on('ping', () => this.resetHeartbeat(socket));
    socket.on('pong', () => this.resetHeartbeat(socket));
    socket.on('message', (data, isBinary) => {
      if (socket !== this.socket) {
        return;
      }
      this.resetHeartbeat(socket);
      if (!isBinary) {
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
      this.heartbeatTimeout.stop();
      this.reconnectTimeout.stop();
      this.cleanupSocket();
    }
  }

  cleanupSocket(): void {
    const socket = this.socket;
    if (socket) {
      this.socket = null;
      this.heartbeatTimeout.stop();
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

  resetHeartbeat(socket: WebSocket): void {
    if (socket !== this.socket) {
      return;
    }
    this.heartbeatTimeout.start(HEARTBEAT_TIMEOUT, () => {
      if (socket === this.socket) {
        console.warn(`Api events connection got nothing for ${HEARTBEAT_TIMEOUT}ms, reconnecting`);
        // emits close, which reconnects
        socket.terminate();
      }
    });
  }

  onClose(socket: WebSocket, code: number, reason: string, handshakeStatusCode: null | number): void {
    if (socket !== this.socket) {
      return;
    }
    this.socket = null;
    this.heartbeatTimeout.stop();
    if (!this.lastId) {
      this.missedEvents = true;
    }
    if (this.ended) {
      return;
    }

    let delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempts++;

    if (code === ApiEventsCloseCodes.UNAUTHORIZED || handshakeStatusCode === 401) {
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
    let payload: ApiEventsPayload;
    try {
      payload = JSON.parse(raw);
    } catch(error) {
      captureError(error, {tags: {source: 'api_events'}});
      return;
    }
    if (!payload || typeof(payload) !== 'object') {
      return;
    }

    switch (payload.type) {
      case 'resync': {
        this.resynced = true;
        this.emitResync();
      }; break;
      case 'ready': {
        if (typeof(payload.id) === 'string') {
          this.lastId = payload.id;
        }
        // a fresh connection after a disconnect can't replay anything, so treat it like the server told us to resync
        if (!this.resumed && !this.resynced && this.missedEvents) {
          this.emitResync();
        }
        this.missedEvents = false;
        this.reconnectAttempts = 0;
        this.lastReportedAt = 0;
      }; break;
      case 'event': {
        if (payload.channel in RedisChannels) {
          try {
            this.emit(payload.channel, (payload.data === undefined) ? null : payload.data);
          } catch(error) {
            captureError(error, {tags: {'api_events.channel': payload.channel, source: 'api_events'}});
          }
        }
        if (typeof(payload.id) === 'string') {
          this.lastId = payload.id;
        }
      }; break;
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
  on(event: ApiEventsSpewerEvents.RESYNC, listener: () => any): this;
  on(event: RedisChannels.GUILD_SETTINGS_UPDATE, listener: (payload: RedisPayloads.GuildSettingsUpdate) => any): this;
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
