import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSpewer } from 'detritus-utils';
import WebSocket from 'ws';

import {
  deleteGuildMusic,
  deleteGuildMusicSession,
  editGuildMusicSession,
  fetchGuildMusic,
  fetchMusicNodes,
  fetchMusicSessions,
  putGuildMusicQueue,
  putGuildMusicQueueBatch,
  putGuildMusicSession,
} from './api';
import { RestResponsesRaw } from './api/types';
import { RequestContext } from './api/raw';


// how long a node gets to answer the websocket, and discord to send our voice state/server after we join
const CONNECT_TIMEOUT = 10 * 1000;
const JOIN_TIMEOUT = 15 * 1000;
// how long a node gets to answer our close when this file is reloaded, then the socket's just dropped
const CLOSE_TIMEOUT = 3 * 1000;
// how long a node keeps our players playing after our websocket closes (we restarted), in seconds
const RESUME_TIMEOUT = 120;
const RECONNECT_DELAY = 2000;
// a node that's been down this long has its guilds moved to another node (failover)
const FAILOVER_DELAY = 10 * 1000;
// guilds moved at once in a failover, the rest wait so they spread over the nodes by their counts
const FAILOVER_BATCH = 10;
// a node that failed to connect is skipped when picking one for this long (then tried again)
const NODE_RETRY_AFTER = 30 * 1000;
// the node pings our websocket every 30 seconds, nothing from it for this long means it froze
const NODE_SILENT_TIMEOUT = 45 * 1000;
// a playing node sends each player's position this often, a dead node's player got at most this much further
const PLAYER_UPDATE_INTERVAL = 5 * 1000;
// a guild whose voice connection the node lost (`VOICE_LOST`) leaves and rejoins for new credentials. Lost again this
// soon after rejoining is the rejoin not working, after this many of those in a row it gives up and holds the track
const REJOIN_RETRY_WINDOW = 2 * 60 * 1000;
const REJOIN_MAX_TRIES = 3;
// with 24/7's `pause_alone`, how long nobody else has to be in the channel before it pauses (a connection blipping)
const ALONE_PAUSE_DELAY = 5 * 1000;
// after starting, how long a music session from the api waits for its server to load before it's given up on, and
// how often the waiting ones are looked at
const RECOVER_WAIT = 60 * 1000;
const RECOVER_INTERVAL = 5 * 1000;

export type MoveReason =
  // the node was disabled, between tracks (the old player is still there to ask and destroy)
  'drain' |
  // the node stopped answering, its players are guessed from their last position
  'down' |
  // the node restarted and lost our players
  'restarted';
// the nodes from the api are fetched again after this long, when they're needed
const NODES_REFRESH_INTERVAL = 60 * 1000;

// what a node's websocket sends, `{op, data}` (notsobot.voice's `SessionMessage`, only the fields we read)
type NodeMessage =
  {op: 'READY', data: {resumed: boolean, sessionId: string}} |
  {op: 'PLAYER_UPDATE', data: {guildId: string, position: number}} |
  NodeEvent;

type NodeEvent =
  {op: 'TRACK_START', data: {guildId: string}} |
  {op: 'TRACK_END', data: {guildId: string, reason: string, track: NodeTrack}} |
  {op: 'TRACK_ERROR', data: {error: string, guildId: string, track: NodeTrack}} |
  {op: 'QUEUE_END', data: {error: null | string, guildId: string}} |
  {op: 'PAUSE_TIMEOUT', data: {guildId: string, timeout: number}} |
  {op: 'VOICE_LOST', data: {error: null | string, guildId: string}};

// the track an event is about, `queueItemId` is null for a url played directly
interface NodeTrack {
  queueItemId: null | string,
}

// a guild's player on a node, what its player routes answer with
export interface NodePlayer {
  connected: boolean,
  // the live effects it plays with stacked (`MusicEffects`), in the order they were picked
  effects: Array<string>,
  guildId: string,
  paused: boolean,
  // milliseconds, -1 before it has a voice connection
  ping: number,
  // milliseconds into the track (its own time, an effect's `speed` changes how fast it goes)
  position: number,
  queue: boolean,
  // how fast the effects play it, 1 without any
  speed: number,
  track: null | {length: number, queueItemId: null | string, title: string, url: string},
  voice: null | {channelId: string, endpoint: string, sessionId: string, token: string},
  // percent, 100 sends the file as it is
  volume: number,
}

export enum VoiceNodeEvents {
  // `{guildId}`, we left the channel (the queue ran out, we got disconnected or the node lost our players)
  LEFT = 'left',
}

interface GuildVoice {
  // `pause_alone` paused it when everyone else left, someone coming back carries on (pausing or resuming by hand takes
  // over from it)
  alonePaused?: boolean,
  // nobody else is in the channel, it pauses when this runs out
  aloneTimeout?: ReturnType<typeof setTimeout> | null,
  // the channel it's playing in (the last one while disconnected)
  channelId?: string,
  // someone disconnected us (or deleted the channel): the node holds the track paused without voice, the queue stays.
  // playing or resuming joins again and carries on, the pause timeout holds it in the api like any pause
  disconnected?: boolean,
  // the node's stacked live effects (`MusicEffects`) and how fast it plays the track with them, what we last told it. A
  // failover and the owner refresh keep them, they go when we leave
  effects?: Array<string>,
  endpoint?: string,
  // 24/7: nothing's playing (the queue ran out), we stay in the channel and the next play starts the node's queue again
  idle?: boolean,
  joinTimeout: ReturnType<typeof setTimeout> | null,
  // when it last moved, the new node's track start is the same track carrying on (not a new one at 0)
  movedAt?: number,
  // moving to another node (its old one was disabled, went down or restarted)
  moving?: boolean,
  // what we last told the node (pause/resume), a failover keeps it
  paused?: boolean,
  // the track's last known position (the node's `playerUpdate`s, a seek, a new track) and when it was, for a failover
  position?: {at: number, value: number},
  // when we last left and rejoined for new voice credentials
  rejoinedAt?: number,
  // left on purpose to rejoin, the leave's voice state isn't us being disconnected
  rejoining?: boolean,
  // rejoins in a row that lost the connection again within `REJOIN_RETRY_WINDOW`
  rejoinTries?: number,
  // the join half of a rejoin, a second after leaving
  rejoinTimeout?: ReturnType<typeof setTimeout> | null,
  // rejoined after a restart (from the api's music session): the queue starts with the playing track from here
  resumeAt?: {paused: boolean, position: number},
  // the node the guild's music is on, it stays there until we leave or it's disabled (then it moves between tracks)
  node: NodeConnection,
  sessionId?: string,
  shard: ShardClient,
  speed?: number,
  // turn on the node's queue mode with the first complete voice state (we just joined to play the queue)
  startQueue: boolean,
  token?: string,
  // the node's volume (percent, 100 or none is the file as it is), kept like `effects`
  volume?: number,
}

/**
 * What a reloaded voicenode.ts (the owner refresh) takes over from the instance before it: made by the old code's
 * `detach`, read by the new code's `adopt`, so a change here has to be read the old way too until the next restart.
 * Timers aren't carried over, only whether they were running
 */
export interface VoiceNodeHandover {
  // every old websocket closed, a node only resumes a session that has no websocket
  closed: Promise<void>,
  guilds: Array<{guild: GuildVoice, guildId: string, joining: boolean, nodeId: string, rejoinPending: boolean}>,
  nodes: Array<{
    disconnectedAt: null | number,
    failedAt: null | number,
    info: RestResponsesRaw.MusicNode,
    // it was connected, connecting or reconnecting
    reconnect: boolean,
    // still asking its players after a restart, the new instance asks again
    restoring: boolean,
    sessionId: null | string,
  }>,
  nodesFetchedAt: number,
  readyShards: Array<number>,
  recoveredSessions: Array<[string, {loadedAt: number, session: RestResponsesRaw.MusicSession}]>,
  resumeDone: boolean,
  // `channelId` is null for a player that was disconnected, it isn't rejoined. `idle` is 24/7 with nothing playing
  resumedPlayers: Array<{channelId: null | string, effects?: Array<string>, guildId: string, idle?: boolean, nodeId: string, paused: boolean, position: number, speed?: number, volume?: number}>,
  triedResume: boolean,
}


/**
 * One music node's websocket and session. The session is resumable: when we restart, the node keeps our players playing
 * (holding them while voice is gone), we reconnect with the session id we saved for it and rejoin their channels
 */
export class NodeConnection {
  client: VoiceNodeClient;
  connecting: null | Promise<string> = null;
  // when the websocket closed, reconnecting stops once the node would have dropped our players anyway
  disconnectedAt: null | number = null;
  // when connecting last failed, the node is skipped when picking one for a bit
  failedAt: null | number = null;
  failoverTimeout: null | ReturnType<typeof setTimeout> = null;
  info: RestResponsesRaw.MusicNode;
  // asking a resumed session's players after we restarted, the api's music sessions wait for it
  restoring: null | Promise<void> = null;
  // the last thing we heard from it (a message or its ping)
  lastSeenAt = 0;
  reconnectTimeout: null | ReturnType<typeof setTimeout> = null;
  // the node said it keeps our players when the websocket closes
  resuming = false;
  sessionId: null | string = null;
  watchdog: null | ReturnType<typeof setInterval> = null;
  ws: null | WebSocket = null;

  constructor(client: VoiceNodeClient, info: RestResponsesRaw.MusicNode) {
    this.client = client;
    this.info = info;
  }

  get id(): string {
    return this.info.id;
  }

  get url(): string {
    return this.info.url.replace(/\/+$/, '');
  }

  get isConnected(): boolean {
    return !!this.sessionId && !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // connected, or worth trying: never failed, or failed long enough ago
  get isAvailable(): boolean {
    return this.isConnected || !this.failedAt || NODE_RETRY_AFTER < Date.now() - this.failedAt;
  }

  get guildIds(): Array<string> {
    return Array.from(this.client.guilds).filter(([, guild]) => guild.node === this).map(([guildId]) => guildId);
  }

  // where its session id is kept between restarts of this cluster
  get sessionFile(): null | string {
    const cluster = this.client.cluster;
    return (cluster) ? path.join(os.tmpdir(), `notsobot-voice-session-${cluster.clusterId}-${this.id}`) : null;
  }

  readSavedSessionId(): null | string {
    try {
      return (this.sessionFile) ? fs.readFileSync(this.sessionFile, 'utf8').trim() || null : null;
    } catch(error) {
      return null;
    }
  }

  connect(userId: string): Promise<string> {
    // reloaded, the new instance has its own connection
    if (this.client.detached) {
      return Promise.reject(new Error('Music was just reloaded, try again'));
    }
    if (this.sessionId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.sessionId);
    }
    if (this.connecting) {
      return this.connecting;
    }

    const headers: Record<string, string> = {authorization: this.info.password, 'client-name': 'notsobot', 'user-id': userId};
    const resumeId = this.sessionId || this.readSavedSessionId();
    if (resumeId) {
      headers['session-id'] = resumeId;
    }

    const promise = this.connecting = new Promise<string>((resolve, reject) => {
      const ws = this.ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/websocket', {
        handshakeTimeout: CONNECT_TIMEOUT,
        headers,
      });
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error(`The voice node ${this.info.name} didn't answer`));
      }, CONNECT_TIMEOUT);

      ws.on('ping', () => this.lastSeenAt = Date.now());
      ws.on('message', (data) => {
        // a websocket we already dropped (reloaded), whatever it still says is for nobody
        if (this.ws !== ws) {
          return;
        }
        this.lastSeenAt = Date.now();
        let message: NodeMessage;
        try {
          message = JSON.parse(data.toString());
        } catch(error) {
          return;
        }
        if (!message || typeof(message.data) !== 'object' || !message.data) {
          return;
        }
        switch (message.op) {
          case 'READY': {
            clearTimeout(timeout);
            this.onReady(ws, message.data.sessionId, !!message.data.resumed);
            resolve(message.data.sessionId);
          }; break;
          case 'PLAYER_UPDATE': {
            this.client.onPlayerUpdate(this, message.data);
          }; break;
          default: {
            this.client.onEvent(this, message);
          };
        }
      });
      ws.on('close', () => {
        clearTimeout(timeout);
        reject(new Error(`The voice node ${this.info.name} connection closed`));
        if (this.ws === ws) {
          this.ws = null;
          this.failedAt = Date.now();
          this.disconnectedAt = this.disconnectedAt || Date.now();
          if (this.watchdog) {
            clearInterval(this.watchdog);
            this.watchdog = null;
          }
          // nothing could take them (no other node up), the node would have dropped them by now anyway
          if (RESUME_TIMEOUT * 1000 < Date.now() - this.disconnectedAt) {
            for (const guildId of this.guildIds) {
              this.client.nodeLost(guildId, this.disconnectedAt);
            }
          }
          if (this.guildIds.length) {
            // a short blip resumes (the node kept playing), a node still gone after a few seconds has its guilds moved
            if (!this.failoverTimeout) {
              const wait = Math.max(0, FAILOVER_DELAY - (Date.now() - this.disconnectedAt));
              this.failoverTimeout = setTimeout(() => {
                this.failoverTimeout = null;
                if (!this.isConnected) {
                  this.client.failover(this, 'down', this.disconnectedAt || Date.now());
                }
              }, wait);
            }
            // the node keeps our players for a bit, reconnect while there's anything to keep
            if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout);
            }
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectTimeout = null;
              this.connect(userId).catch((error) => console.warn(`voice node ${this.info.name} reconnect`, error));
            }, RECONNECT_DELAY);
          }
        }
      });
      ws.on('error', (error) => console.warn(`voice node ${this.info.name}`, error));
    });
    promise.then(() => this.connecting = null, () => this.connecting = null);
    return promise;
  }

  private onReady(ws: WebSocket, sessionId: string, resumed: boolean) {
    const previousId = this.sessionId;
    const downAt = this.disconnectedAt;
    this.disconnectedAt = null;
    this.failedAt = null;
    this.lastSeenAt = Date.now();
    this.resuming = false;
    this.sessionId = sessionId;
    if (this.failoverTimeout) {
      clearTimeout(this.failoverTimeout);
      this.failoverTimeout = null;
    }
    // a node that froze (no ping, no messages) never closes the websocket itself
    if (this.watchdog) {
      clearInterval(this.watchdog);
    }
    this.watchdog = setInterval(() => {
      if (this.ws === ws && NODE_SILENT_TIMEOUT < Date.now() - this.lastSeenAt) {
        console.warn(`voice node ${this.info.name} stopped answering`);
        ws.terminate();
      }
    }, 10 * 1000);
    if (this.sessionFile) {
      try {
        fs.writeFileSync(this.sessionFile, sessionId);
      } catch(error) {
        console.warn('voice node session file', error);
      }
    }
    this.request('PATCH', `/sessions/${sessionId}`, {resuming: true, timeout: RESUME_TIMEOUT})
      .then(() => this.resuming = this.sessionId === sessionId)
      .catch((error) => console.warn(`voice node ${this.info.name} resuming`, error));

    if (resumed) {
      // after a restart we don't know what's playing, the node does
      if (!previousId) {
        this.restoring = this.restorePlayers()
          .catch((error) => console.warn(`voice node ${this.info.name} restore`, error))
          .finally(() => this.restoring = null);
      } else {
        // back after a failover moved some of its guilds, their old players here go
        this.dropMovedPlayers().catch((error) => console.warn(`voice node ${this.info.name} cleanup`, error));
      }
    } else {
      // a new session, the node lost the players we had on it (it restarted, or we were gone too long), they start
      // again from where they were, on whichever node has the fewest guilds (this one counts too)
      this.client.failover(this, 'restarted', downAt || Date.now());
    }
  }

  private async restorePlayers() {
    const players: Array<NodePlayer> = await this.request('GET', `/sessions/${this.sessionId}/players`);
    for (const player of players) {
      const guild = this.client.guilds.get(player.guildId);
      if (guild) {
        // already ours (reloaded while restoring, the old instance rejoined it), or playing on another node by now
        if (guild.node !== this) {
          await this.destroyPlayer(player.guildId).catch(() => {});
        }
        continue;
      }
      // one without voice in queue mode was disconnected, it's held paused for someone to resume
      if ((player.voice && player.voice.channelId) || player.queue) {
        this.client.resumedPlayers.set(player.guildId, {
          channelId: (player.voice) ? player.voice.channelId : null,
          effects: player.effects || [],
          // in voice without a track: 24/7 kept us there after the queue ran out, the next play starts the queue again
          idle: !player.track,
          node: this,
          paused: !!player.paused,
          position: player.position || 0,
          volume: player.volume ?? 100,
          speed: player.speed || 1,
        });
      }
    }
    this.client.rejoinResumed();
  }

  private async dropMovedPlayers() {
    const players: Array<NodePlayer> = await this.request('GET', `/sessions/${this.sessionId}/players`);
    for (const player of players) {
      const guild = this.client.guilds.get(player.guildId);
      // a resumed player still waiting for its shard to rejoin is ours too
      const resumed = this.client.resumedPlayers.get(player.guildId);
      const ours = (guild) ? guild.node === this : !!resumed && resumed.node === this;
      if (!ours) {
        await this.destroyPlayer(player.guildId).catch(() => {});
      }
    }
  }

  // this file is being reloaded: stops its timers and closes the websocket without touching the players (the session
  // is resuming, the node keeps them playing), resolves once it's closed for the next instance to resume it
  async detach(): Promise<void> {
    for (const timeout of [this.failoverTimeout, this.reconnectTimeout]) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    if (this.watchdog) {
      clearInterval(this.watchdog);
    }
    this.failoverTimeout = this.reconnectTimeout = this.watchdog = null;
    // its close handler and messages see it isn't ours anymore
    const ws = this.ws;
    this.ws = null;
    if (!ws) {
      return;
    }
    // closing before the node agreed to keep our players would end them
    if (this.sessionId && !this.resuming && ws.readyState === WebSocket.OPEN) {
      await this.request('PATCH', `/sessions/${this.sessionId}`, {resuming: true, timeout: RESUME_TIMEOUT})
        .catch((error) => console.warn(`voice node ${this.info.name} resuming`, error));
    }
    if (ws.readyState === WebSocket.CLOSED) {
      return;
    }
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => ws.terminate(), CLOSE_TIMEOUT);
      ws.once('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      ws.close(1000, 'Reloading');
    });
  }

  async updatePlayer(guildId: string, body: Record<string, unknown>): Promise<NodePlayer> {
    return this.request('PATCH', `/sessions/${this.sessionId}/players/${guildId}`, body);
  }

  async getPlayer(guildId: string): Promise<NodePlayer | null> {
    if (!this.sessionId) {
      return null;
    }
    return this.request('GET', `/sessions/${this.sessionId}/players/${guildId}`).catch(() => null);
  }

  async destroyPlayer(guildId: string): Promise<void> {
    if (this.sessionId) {
      await this.request('DELETE', `/sessions/${this.sessionId}/players/${guildId}`);
    }
  }

  async request(method: string, path: string, body?: Record<string, unknown>): Promise<any> {
    if (!this.sessionId) {
      throw new Error(`Not connected to the voice node ${this.info.name}`);
    }
    const response = await fetch(this.url + path, {
      body: (body) ? JSON.stringify(body) : undefined,
      headers: {authorization: this.info.password, 'content-type': 'application/json'},
      method,
    });
    const data: any = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((data && data.message) || `The voice node ${this.info.name} responded with ${response.status}`);
    }
    return data;
  }
}


/**
 * notsobot.voice, the music nodes (they play opus files), managed on the dashboard and given to
 * us by the api (`GET /music/nodes`). The music queue lives in the api (`/music/queue/<id>`), a node pulls the next
 * track from it itself, so here we only join/leave channels on our own gateway and forward our voice state and voice
 * server to the guild's node (see `listeners/voicenode.ts`). A guild goes on the node with the fewest of our guilds
 */
export class VoiceNodeClient extends EventSpewer {
  cluster: ClusterClient | null = null;
  // this file was reloaded and this instance handed everything over (`detach`), it doesn't connect or join anymore
  detached = false;
  guilds = new Map<string, GuildVoice>();
  // by queue item id, told the node's error when it couldn't play that item (until the item ends or we leave)
  trackErrorListeners = new Map<string, {guildId: string, listener: (error: string) => void}>();
  // by guild, told when its next track starts or we leave (a skip shows what comes after it)
  nextTrackWaiters = new Map<string, Set<(result: 'left' | 'started') => void>>();
  nodes = new Map<string, NodeConnection>();
  nodesFetchedAt = 0;
  nodesFetching: null | Promise<void> = null;
  readyShards = new Set<number>();
  // players a node kept for us through a restart, rejoined once their shard is ready
  resumedPlayers = new Map<string, {channelId: null | string, effects?: Array<string>, idle?: boolean, node: NodeConnection, paused: boolean, position: number, speed?: number, volume?: number}>();
  // music sessions from the api that no node kept playing (it restarted too), rejoined once their server is loaded
  recoveredSessions = new Map<string, {loadedAt: number, session: RestResponsesRaw.MusicSession}>();
  recoveryInterval: null | ReturnType<typeof setInterval> = null;
  // the resume after starting is over (its node sessions and the api's music sessions were looked at)
  resumeDone = false;
  triedResume = false;

  // every node from the api, disabled ones too: they get no new guilds and the ones on them move off between tracks,
  // but we still reconnect to them after restarting. deleted ones are treated as disabled until their guilds leave
  async refreshNodes(shard: ShardClient, force: boolean = false): Promise<void> {
    if (!force && Date.now() - this.nodesFetchedAt < NODES_REFRESH_INTERVAL) {
      return;
    }
    if (!this.nodesFetching) {
      this.nodesFetching = fetchMusicNodes({client: shard}).then(({ nodes }) => {
        this.nodesFetchedAt = Date.now();
        const ids = new Set(nodes.map((node) => node.id));
        for (const info of nodes) {
          const existing = this.nodes.get(info.id);
          if (existing) {
            existing.info = info;
          } else {
            this.nodes.set(info.id, new NodeConnection(this, info));
          }
        }
        for (const [id, node] of Array.from(this.nodes)) {
          if (!ids.has(id)) {
            if (node.guildIds.length) {
              // deleted, its last info still says what it was
              node.info = {...node.info, enabled: false};
            } else {
              this.nodes.delete(id);
            }
          }
        }
      }).finally(() => this.nodesFetching = null);
    }
    return this.nodesFetching;
  }

  // the enabled node with the fewest of our guilds that we can connect to (connected), skipping ones that just failed
  // and `exclude` (a node that's down)
  async pickNode(shard: ShardClient, exclude?: NodeConnection): Promise<NodeConnection> {
    await this.refreshNodes(shard);
    const enabled = Array.from(this.nodes.values()).filter((node) => node.info.enabled);
    if (!enabled.length) {
      throw new Error('There are no voice nodes, add one on the dashboard');
    }
    const candidates = enabled
      .filter((node) => node !== exclude && node.isAvailable)
      .sort((x, y) => x.guildIds.length - y.guildIds.length);
    let lastError: Error = new Error('No voice node can be reached right now');
    for (const node of candidates) {
      try {
        await node.connect(shard.userId);
        return node;
      } catch(error) {
        // marked failed by its websocket closing, the next one's tried
        lastError = error;
      }
    }
    throw lastError;
  }

  // a shard (re)connected, resumes the node sessions we had before restarting, then rejoins their players' channels
  onShardReady(shard: ShardClient) {
    this.readyShards.add(shard.shardId);
    if (!this.triedResume) {
      this.triedResume = true;
      this.resumeSessions(shard);
    }
    this.rejoinResumed();
    this.rejoinRecovered();
  }

  private resumeSessions(shard: ShardClient) {
    this.refreshNodes(shard, true).then(async () => {
      // the nodes first, they know exactly what they kept playing
      await Promise.all(Array.from(this.nodes.values()).filter((node) => node.readSavedSessionId()).map((node) => {
        return node.connect(shard.userId)
          .then(() => node.restoring)
          .catch((error) => console.warn(`voice node ${node.info.name} resume`, error));
      }));
      // then the api, for servers that were playing on a node that restarted too
      await this.loadSessions(shard);
    }).catch((error) => console.warn('voice nodes', error)).finally(() => this.resumeDone = true);
  }

  // the api's music sessions on our shards, every start (usually none): the ones the nodes didn't keep are rejoined
  private async loadSessions(shard: ShardClient) {
    const cluster = this.cluster;
    const shardIds = (cluster) ? Array.from(cluster.shards.keys()) : [shard.shardId];
    const shardCount = (cluster) ? cluster.shardCount : 1;
    const { sessions } = await fetchMusicSessions({client: shard}, {shardCount, shardIds});
    if (this.detached) {
      return;
    }
    for (const session of sessions) {
      if (!this.guilds.has(session.guild_id) && !this.resumedPlayers.has(session.guild_id)) {
        this.recoveredSessions.set(session.guild_id, {loadedAt: Date.now(), session});
      }
    }
    if (!this.recoveredSessions.size) {
      return;
    }
    console.log(`voice nodes: rejoining ${this.recoveredSessions.size} servers that were playing music before restarting`);
    this.rejoinRecovered();
    this.watchRecovered();
  }

  // their servers come in after the shard is ready
  private watchRecovered() {
    if (this.recoveredSessions.size && !this.recoveryInterval) {
      this.recoveryInterval = setInterval(() => {
        this.rejoinRecovered();
        if (!this.recoveredSessions.size && this.recoveryInterval) {
          clearInterval(this.recoveryInterval);
          this.recoveryInterval = null;
        }
      }, RECOVER_INTERVAL);
    }
  }

  // rejoins recovered sessions whose server is loaded, if someone's still in the channel to hear it (24/7 ones anyway)
  rejoinRecovered() {
    for (const [guildId, { loadedAt, session }] of Array.from(this.recoveredSessions)) {
      const shard = this.shardForGuild(guildId);
      if (!shard || !this.readyShards.has(shard.shardId)) {
        continue;
      }
      // someone played something in the meantime
      if (this.guilds.has(guildId)) {
        this.recoveredSessions.delete(guildId);
        continue;
      }
      const channel = shard.channels.get(session.channel_id);
      if (!channel) {
        // not loaded yet, or gone
        if (RECOVER_WAIT < Date.now() - loadedAt) {
          this.recoveredSessions.delete(guildId);
          deleteGuildMusicSession({client: shard}, guildId).catch(() => {});
        }
        continue;
      }
      this.recoveredSessions.delete(guildId);
      if (!this.hasListeners(shard, channel.id) && !session.stay) {
        deleteGuildMusicSession({client: shard}, guildId).catch(() => {});
        continue;
      }
      this.recoverGuild(shard, guildId, channel.id, session)
        .catch((error) => console.warn(`voice node recover ${guildId}`, error));
    }
  }

  private async recoverGuild(shard: ShardClient, guildId: string, channelId: string, session: RestResponsesRaw.MusicSession) {
    let node: NodeConnection;
    try {
      node = await this.pickNode(shard);
    } catch(error) {
      // no node can be reached right now: 24/7 ones wait and try again (picking one is what reconnects to the nodes,
      // a failed one every `NODE_RETRY_AFTER`), the rest are given up on
      if (session.stay && !this.detached && !this.guilds.has(guildId) && !this.recoveredSessions.has(guildId)) {
        this.recoveredSessions.set(guildId, {loadedAt: Date.now(), session});
        this.watchRecovered();
        return;
      }
      throw error;
    }
    if (this.detached || this.guilds.has(guildId)) {
      return;
    }
    this.join(shard, guildId, channelId, true, node);
    const guild = this.guilds.get(guildId)!;
    // they were on before the restart, they go back on with the queue
    guild.effects = session.effects || [];
    guild.volume = session.volume ?? 100;
    // a track that would have ended by now isn't carried on, the queue starts with the next one
    if (!session.finished) {
      guild.resumeAt = {paused: session.paused, position: session.position};
    }
    console.log(`voice node rejoined ${guildId} on ${node.info.name} at ${(session.finished) ? 'the next track' : `${session.position}ms`}`);
  }

  // the restarted shard identified as a new session, so discord dropped us from voice: join again for the nodes'
  // players, they continue where they were held once the new voice state reaches them
  rejoinResumed() {
    for (const [guildId, { channelId, effects, idle, node, paused, position, speed, volume }] of Array.from(this.resumedPlayers)) {
      const shard = this.shardForGuild(guildId);
      if (!shard || !this.readyShards.has(shard.shardId)) {
        continue;
      }
      this.resumedPlayers.delete(guildId);
      if (!channelId) {
        // disconnected before the restart, still waiting for someone to resume it
        const held = {at: Date.now(), value: position};
        this.guilds.set(guildId, {disconnected: true, effects, joinTimeout: null, node, paused: true, position: held, shard, speed, startQueue: false, volume});
        continue;
      }
      this.join(shard, guildId, channelId, false, node);
      const guild = this.guilds.get(guildId);
      if (guild) {
        guild.effects = effects;
        guild.paused = paused;
        guild.position = {at: Date.now(), value: position};
        guild.speed = speed;
        guild.volume = volume;
        // nothing's playing (24/7 after the queue ran out): the next play has to start the node's queue again, like
        // `queueEnded` left it. Without it we'd think it's playing and the queued track would never start
        if (idle) {
          guild.idle = true;
          guild.paused = false;
          guild.position = {at: Date.now(), value: 0};
        }
      }
    }
  }

  private shardForGuild(guildId: string): ShardClient | undefined {
    if (!this.cluster) {
      return undefined;
    }
    const shardId = Number((BigInt(guildId) >> 22n) % BigInt(this.cluster.shardCount));
    return this.cluster.shards.get(shardId);
  }

  private join(shard: ShardClient, guildId: string, channelId: string, startQueue: boolean, node: NodeConnection) {
    // reloaded, something still running from before (a restore) doesn't join for the old instance
    if (this.detached) {
      return;
    }
    const guild = this.guilds.get(guildId);
    if (guild && guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
    }
    this.guilds.set(guildId, {
      ...guild,
      joinTimeout: setTimeout(() => this.leave(guildId), JOIN_TIMEOUT),
      node,
      shard,
      startQueue: startQueue || !!(guild && guild.startQueue),
    });
    shard.gateway.voiceStateUpdate(guildId, channelId, {selfDeaf: true});
    // effects and a volume still on (a reconnect after being disconnected, whose session went) are kept for a restart too
    const effects = (guild && guild.effects && guild.effects.length) ? guild.effects : undefined;
    const volume = (guild && guild.volume !== undefined && guild.volume !== 100) ? guild.volume : undefined;
    putGuildMusicSession({client: shard}, guildId, {channelId, effects, nodeId: node.id, volume})
      .catch((error) => console.warn(`voice node session ${guildId}`, error));
  }

  // keeps the api's music session up to date (only for a restart to carry on from, so nothing waits on it)
  private editSession(guildId: string, guild: GuildVoice, options: Parameters<typeof editGuildMusicSession>[2]) {
    editGuildMusicSession({client: guild.shard}, guildId, options)
      .catch((error) => console.warn(`voice node session ${guildId}`, error));
  }

  // queues a search result in the api, and joins the channel to play the queue if we're not playing in the guild
  // already (on the node with the fewest guilds)
  async play(
    context: RequestContext,
    shard: ShardClient,
    guildId: string,
    channelId: string,
    result: RestResponsesRaw.MusicSearchResult | Array<RestResponsesRaw.MusicSearchResult>,
    userId: string,
    // an album's/playlist's name, for its tracks
    name?: null | string,
  ): Promise<{
    batch: null | RestResponsesRaw.PutGuildMusicQueueBatch,
    item: RestResponsesRaw.GuildMusicQueueItem,
    joined: boolean,
    // paused too long the last time (`hold`), this track carries on from `position` before the queue
    resumed: null | {item: RestResponsesRaw.GuildMusicQueueItem, position: number},
  }> {
    const guild = this.guilds.get(guildId);
    const node = (guild) ? guild.node : await this.pickNode(shard);
    if (guild) {
      await node.connect(shard.userId);
    }
    // an album's/playlist's tracks go in together (as many as fit), `item` is the first of them
    let batch: null | RestResponsesRaw.PutGuildMusicQueueBatch = null;
    let item: RestResponsesRaw.GuildMusicQueueItem;
    if (Array.isArray(result)) {
      const tracks = result.filter((x) => x.track).map((x) => ({track: x.track!, url: x.url}));
      batch = await putGuildMusicQueueBatch(context, guildId, {name, tracks, userId});
      item = batch.items[0];
    } else {
      item = await putGuildMusicQueue(context, guildId, {track: result.track, url: result.url, userId});
    }
    // a held track (paused too long the last time) carries on first, from where it was
    let resumed: null | {item: RestResponsesRaw.GuildMusicQueueItem, position: number} = null;
    if (!this.guilds.has(guildId)) {
      const music = await fetchGuildMusic(context, guildId).catch(() => null);
      if (music && music.current && music.held_position !== null) {
        resumed = {item: music.current, position: music.held_position};
      }
    }
    // reloaded while queueing: a guild that was playing goes on with it on the new instance, one that wasn't can't be
    // joined from this one
    if (this.detached) {
      if (guild) {
        return {batch, item, joined: false, resumed: null};
      }
      throw new Error('Music was just reloaded, try again');
    }
    const joined = !this.guilds.has(guildId);
    if (joined) {
      this.join(shard, guildId, channelId, true, node);
      if (resumed) {
        this.guilds.get(guildId)!.resumeAt = {paused: false, position: resumed.position};
      }
    } else if (guild && guild.idle) {
      // 24/7 with nothing playing, the node's queue starts again (like joining, the reply waits for it)
      await this.startIdle(guildId, guild);
      return {batch, item, joined: true, resumed: null};
    } else {
      // queued while disconnected, the held track carries on in their channel
      this.reconnect(guildId, channelId);
    }
    return {batch, item, joined, resumed: (joined) ? resumed : null};
  }

  // `listener` gets the node's error if the queue item fails (converting it, or while it plays), once
  onTrackError(guildId: string, queueItemId: string, listener: (error: string) => void) {
    this.trackErrorListeners.set(queueItemId, {guildId, listener});
  }

  // false while joining, while disconnected (`reconnect` carries on from there) and while 24/7 keeps us in voice with
  // nothing playing
  isPlaying(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && !guild.startQueue && !guild.disconnected && !guild.idle;
  }

  // 24/7 got turned off: an idle guild leaves now, a playing one when its queue runs out
  unstay(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (guild && guild.idle) {
      this.leave(guildId);
    }
  }

  // an idle guild (24/7) plays its queue again
  private async startIdle(guildId: string, guild: GuildVoice) {
    guild.idle = false;
    guild.paused = false;
    guild.position = {at: Date.now(), value: 0};
    await guild.node.updatePlayer(guildId, {paused: false, queue: true});
  }

  // the queue ran out: 24/7 servers keep us in the channel (idle until the next play), the rest we leave. The api says
  // which, from the server's setting and premium
  private async queueEnded(guildId: string, guild: GuildVoice) {
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    if (this.guilds.get(guildId) !== guild) {
      return;
    }
    if (!music || !music.premium || !music.stay || guild.disconnected) {
      return this.leave(guildId);
    }
    guild.idle = true;
    guild.paused = false;
    guild.position = {at: Date.now(), value: 0};
    // nothing comes next (a skip of the last track waits for this)
    this.resolveNextTrack(guildId, 'left');
    this.editSession(guildId, guild, {paused: false, position: 0});
  }

  isDisconnected(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && !!guild.disconnected;
  }

  // held music (paused too long, or `music leave` kept the queue): joins `channelId` and the held track carries on from
  // where it was, then the queue. null when nothing's held (or we're in voice for the guild already)
  async resumeHeld(
    context: RequestContext,
    shard: ShardClient,
    guildId: string,
    channelId: string,
  ): Promise<null | {item: RestResponsesRaw.GuildMusicQueueItem, position: number}> {
    if (this.guilds.has(guildId) || this.detached) {
      return null;
    }
    const music = await fetchGuildMusic(context, guildId).catch(() => null);
    if (!music || !music.current || music.held_position === null) {
      return null;
    }
    const node = await this.pickNode(shard);
    if (this.detached || this.guilds.has(guildId)) {
      return null;
    }
    this.join(shard, guildId, channelId, true, node);
    this.guilds.get(guildId)!.resumeAt = {paused: false, position: music.held_position};
    return {item: music.current, position: music.held_position};
  }

  // joins `channelId` after we were disconnected, the node's held track carries on unpaused once our voice state
  // reaches it (`forwardVoice`)
  reconnect(guildId: string, channelId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.disconnected || this.detached) {
      return false;
    }
    this.join(guild.shard, guildId, channelId, false, guild.node);
    return true;
  }

  // someone other than a bot in `channelId`, a channel that isn't cached counts as listened to
  private hasListeners(shard: ShardClient, channelId: string): boolean {
    const channel = shard.channels.get(channelId);
    if (!channel || !(channel.isGuildVoice || channel.isGuildStageVoice)) {
      return !channel;
    }
    return channel.voiceStates.some((state) => state.userId !== shard.userId && !(state.member && state.member.bot));
  }

  // someone joined or left a voice channel in a guild we're playing in (or we were moved): with 24/7's `pause_alone`
  // the track pauses once nobody else is in our channel, and carries on when someone comes back to one it paused
  handleListeners(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.channelId || this.detached) {
      return;
    }
    if (this.hasListeners(guild.shard, guild.channelId)) {
      if (guild.aloneTimeout) {
        clearTimeout(guild.aloneTimeout);
        guild.aloneTimeout = null;
      }
      if (guild.alonePaused) {
        this.setPaused(guildId, false).catch((error) => console.warn(`voice node resuming ${guildId} for a listener`, error));
      }
      return;
    }
    if (guild.aloneTimeout || guild.paused || !this.isPlaying(guildId)) {
      return;
    }
    guild.aloneTimeout = setTimeout(() => {
      guild.aloneTimeout = null;
      this.pauseAlone(guildId, guild).catch((error) => console.warn(`voice node pausing ${guildId} alone`, error));
    }, ALONE_PAUSE_DELAY);
  }

  // still nobody listening after `ALONE_PAUSE_DELAY`, it pauses if the server has `pause_alone` (and 24/7, otherwise
  // the pause timeout would leave)
  private async pauseAlone(guildId: string, guild: GuildVoice) {
    const stillAlone = () => {
      return this.guilds.get(guildId) === guild && !guild.paused && this.isPlaying(guildId) && !!guild.channelId &&
        !this.hasListeners(guild.shard, guild.channelId);
    };
    if (!stillAlone()) {
      return;
    }
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    if (!music || !music.premium || !music.stay || !music.pause_alone || !stillAlone()) {
      return;
    }
    await this.setPaused(guildId, true, true);
  }

  // pausing keeps the voice connection and the track's position, null when nothing's playing in the guild. `alone` is
  // `pause_alone`'s, a listener coming back undoes it (anyone else's pause or resume stays)
  async setPaused(guildId: string, paused: boolean, alone: boolean = false): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    // before the node answers, a listener coming back in the meantime resumes it
    guild.alonePaused = alone && paused;
    const player = await guild.node.updatePlayer(guildId, {paused});
    guild.paused = paused;
    if (player) {
      guild.position = {at: Date.now(), value: player.position || 0};
    }
    this.editSession(guildId, guild, {paused, position: (guild.position) ? guild.position.value : undefined});
    return (player && player.track) ? player : null;
  }

  // `position` in milliseconds, past the end ends the track (and the queue goes on), null when nothing's playing
  async seek(guildId: string, position: number): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {position});
    guild.position = {at: Date.now(), value: position};
    this.editSession(guildId, guild, {position});
    return (player && player.track) ? player : null;
  }

  // the node's stacked live effects (`MusicEffects`, none turns them off, the formatter sorts out what stacks), they stay
  // on across tracks until we leave. null when nothing's playing
  async setEffects(guildId: string, effects: Array<string>): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {effects});
    guild.effects = effects;
    // a restart puts them back on (`recoverGuild`)
    this.editSession(guildId, guild, {effects});
    guild.speed = (player && player.speed) || 1;
    if (player) {
      guild.position = {at: Date.now(), value: player.position || 0};
    }
    return (player && player.track) ? player : null;
  }

  // the node's volume (percent, 0 to 200, 100 is the file as it is), it stays across tracks until we leave like the
  // effects. null when nothing's playing
  async setVolume(guildId: string, volume: number): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {volume});
    guild.volume = volume;
    // a restart puts it back (`recoverGuild`)
    this.editSession(guildId, guild, {volume});
    return (player && player.track) ? player : null;
  }

  // what's playing back to the start, playing or paused as it was. Disconnected, it stays held paused at the start for
  // `reconnect`. null when nothing's playing (joining, 24/7 with nothing on)
  async replay(guildId: string): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.idle || guild.startQueue) {
      return null;
    }
    if (!guild.disconnected) {
      return this.seek(guildId, 0);
    }
    const player = await guild.node.updatePlayer(guildId, {position: 0});
    guild.position = {at: Date.now(), value: 0};
    this.editSession(guildId, guild, {position: 0});
    return (player && player.track) ? player : null;
  }

  // ends the track, the node goes on with the next queued item (or the queue ends and we leave). The node keeps
  // `paused` across tracks, so it's unpaused too
  async skip(guildId: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return false;
    }
    await guild.node.updatePlayer(guildId, {paused: false, skip: true});
    guild.paused = false;
    this.editSession(guildId, guild, {paused: false});
    return true;
  }

  // resolves when the guild's next track starts, or we leave (the queue ran out), `timeout` otherwise (a link still
  // converting, a node that didn't answer). Waited on before a skip, so a quick answer from the node isn't missed
  waitForNextTrack(guildId: string, timeout: number = 5000): Promise<'left' | 'started' | 'timeout'> {
    return new Promise((resolve) => {
      const waiters = this.nextTrackWaiters.get(guildId) || new Set();
      this.nextTrackWaiters.set(guildId, waiters);
      const waiter = (result: 'left' | 'started') => {
        clearTimeout(timer);
        resolve(result);
      };
      const timer = setTimeout(() => {
        waiters.delete(waiter);
        if (!waiters.size && this.nextTrackWaiters.get(guildId) === waiters) {
          this.nextTrackWaiters.delete(guildId);
        }
        resolve('timeout');
      }, timeout);
      waiters.add(waiter);
    });
  }

  private resolveNextTrack(guildId: string, result: 'left' | 'started') {
    const waiters = this.nextTrackWaiters.get(guildId);
    if (waiters) {
      this.nextTrackWaiters.delete(guildId);
      for (const waiter of waiters) {
        waiter(result);
      }
    }
  }

  // the guild's player on its node, null when there's none
  async getPlayer(guildId: string): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    return (guild) ? guild.node.getPlayer(guildId) : null;
  }

  // `clearQueue` empties the api's queue too, for leaving on purpose (not when the node lost our players)
  leave(guildId: string, clearQueue: boolean = false) {
    const guild = this.drop(guildId);
    if (!guild) {
      return;
    }
    if (clearQueue) {
      // the session goes with it
      deleteGuildMusic({client: guild.shard}, guildId).catch((error) => console.warn('voice node clear queue', error));
    } else {
      deleteGuildMusicSession({client: guild.shard}, guildId).catch((error) => console.warn('voice node session', error));
    }
    this.emit(VoiceNodeEvents.LEFT, {guildId});
  }

  // its node stayed out of reach past `RESUME_TIMEOUT` and no other node took it (the node dropped its player by now):
  // we leave. 24/7 servers keep the api's music session and wait in `recoveredSessions` like after a restart, rejoining
  // where they were once a node can be reached. A disconnected one keeps its hold, the rest lose the session like a leave
  nodeLost(guildId: string, downAt: number) {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return;
    }
    const channelId = guild.channelId;
    const paused = !!guild.paused;
    const position = (guild.idle) ? 0 : this.estimatePosition(guild, downAt);
    this.drop(guildId);
    this.emit(VoiceNodeEvents.LEFT, {guildId});
    if (guild.disconnected) {
      return;
    }
    const shard = guild.shard;
    if (!channelId) {
      deleteGuildMusicSession({client: shard}, guildId).catch((error) => console.warn('voice node session', error));
      return;
    }
    fetchGuildMusic({client: shard}, guildId).catch(() => null).then((music) => {
      // someone played something in the meantime, its join made a new session
      if (this.detached || this.guilds.has(guildId)) {
        return;
      }
      if (!music || !music.premium || !music.stay) {
        deleteGuildMusicSession({client: shard}, guildId).catch((error) => console.warn('voice node session', error));
        return;
      }
      editGuildMusicSession({client: shard}, guildId, {nodeId: null, paused, position})
        .catch((error) => console.warn(`voice node session ${guildId}`, error));
      const effects = guild.effects || [];
      const volume = guild.volume ?? 100;
      this.recoveredSessions.set(guildId, {
        loadedAt: Date.now(),
        // 24/7 with nothing playing has no track to carry on, the queue starts again
        session: {channel_id: channelId, effects, finished: !!guild.idle, guild_id: guildId, held: false, node_id: null, paused, position, stay: true, volume},
      });
      console.log(`voice node ${guild.node.info.name} lost ${guildId} (24/7), rejoining at ${position}ms once a node can be reached`);
      this.watchRecovered();
    });
  }

  // paused too long (disconnected ones too), or `music leave` keeping the queue: we leave and the node's player goes, the
  // api keeps the queue and its playing item, the session is kept held where it stopped (no restart rejoins it). The
  // next `play` carries on from there before what it queued
  hold(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.channelId) {
      return this.leave(guildId);
    }
    const channelId = guild.channelId;
    // still playing, it went on since the last update
    let position = 0;
    if (guild.position) {
      const played = (guild.paused || guild.disconnected) ? 0 : Date.now() - guild.position.at;
      position = guild.position.value + Math.round(played * (guild.speed || 1));
    }
    this.drop(guildId);
    // leaving takes the effects and the volume off, like `leave`
    putGuildMusicSession({client: guild.shard}, guildId, {channelId, effects: [], held: true, nodeId: null, paused: true, position, volume: 100})
      .catch((error) => console.warn(`voice node hold ${guildId}`, error));
    console.log(`voice node held ${guildId} at ${position}ms`);
    this.emit(VoiceNodeEvents.LEFT, {guildId});
  }

  // leaves the channel and ends the node's player, what happens to the api's queue and session is up to the caller
  private drop(guildId: string): GuildVoice | null {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return null;
    }
    this.guilds.delete(guildId);
    this.resolveNextTrack(guildId, 'left');
    for (const timeout of [guild.aloneTimeout, guild.joinTimeout]) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    for (const [queueItemId, waiter] of this.trackErrorListeners) {
      if (waiter.guildId === guildId) {
        this.trackErrorListeners.delete(queueItemId);
      }
    }
    guild.shard.gateway.voiceStateUpdate(guildId, null);
    guild.node.destroyPlayer(guildId).catch(() => {});
    return guild;
  }

  // from VOICE_STATE_UPDATE for us, `channelId` is null when we left or got disconnected (kicked, the channel deleted)
  handleVoiceState(guildId: string, channelId: null | string, sessionId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return;
    }
    if (!channelId) {
      if (guild.rejoining) {
        // our own leave to rejoin, the new voice server comes with the join
        guild.rejoining = false;
        guild.endpoint = guild.token = undefined;
        return;
      }
      // still joining, nothing's on the node to hold
      if (guild.startQueue) {
        return this.leave(guildId, true);
      }
      return this.disconnect(guildId, guild);
    }
    if (guild.channelId && guild.channelId !== channelId && !guild.disconnected) {
      // someone dragged us to another channel
      this.editSession(guildId, guild, {channelId});
    }
    guild.channelId = channelId;
    guild.sessionId = sessionId;
    this.forwardVoice(guildId, guild);
  }

  // someone disconnected us: the node drops its voice connection and holds the track paused (its pause timeout leaves
  // for us), the queue stays for `reconnect`. The api's music session is held where it stopped (like `hold`), so if we
  // and the node both restart the next `music play` still carries on with it. Reconnecting's join clears the hold
  private disconnect(guildId: string, guild: GuildVoice) {
    if (guild.disconnected) {
      return;
    }
    // 24/7 with nothing playing has nothing to hold, it stays out until the next play
    if (guild.idle) {
      return this.leave(guildId);
    }
    for (const timeout of [guild.aloneTimeout, guild.joinTimeout, guild.rejoinTimeout]) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    guild.aloneTimeout = guild.joinTimeout = guild.rejoinTimeout = null;
    guild.alonePaused = false;
    // where it got to before it's paused, the node's answer is exact and replaces it
    const position = this.estimatePosition(guild, Date.now());
    guild.disconnected = true;
    guild.endpoint = guild.sessionId = guild.token = undefined;
    guild.paused = true;
    guild.position = {at: Date.now(), value: position};
    const channelId = guild.channelId;
    const held = (channelId) ?
      putGuildMusicSession({client: guild.shard}, guildId, {channelId, effects: [], held: true, nodeId: null, paused: true, position, volume: 100}) :
      deleteGuildMusicSession({client: guild.shard}, guildId);
    held.catch((error) => console.warn(`voice node hold ${guildId}`, error));
    guild.node.updatePlayer(guildId, {paused: true, voice: null}).then(async (player) => {
      if (player) {
        guild.position = {at: Date.now(), value: player.position || 0};
        // after the hold's saved, a patch before it would find no session
        await held.catch(() => {});
        if (this.guilds.get(guildId) === guild && guild.disconnected) {
          this.editSession(guildId, guild, {position: guild.position.value});
        }
      }
    }).catch((error) => console.warn(`voice node ${guild.node.info.name} pausing ${guildId}`, error));
  }

  // from VOICE_SERVER_UPDATE, a null endpoint means discord is moving us to another voice server (another update follows)
  handleVoiceServer(guildId: string, endpoint: null | string, token: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !endpoint) {
      return;
    }
    guild.endpoint = endpoint;
    guild.token = token;
    this.forwardVoice(guildId, guild);
  }

  private forwardVoice(guildId: string, guild: GuildVoice) {
    const { channelId, endpoint, sessionId, token } = guild;
    if (!channelId || !endpoint || !sessionId || !token) {
      return;
    }
    const body: Record<string, unknown> = {voice: {channelId, endpoint, sessionId, token}};
    if (guild.startQueue) {
      body.paused = false;
      body.queue = true;
      guild.startQueue = false;
      // a restart's recovered effects and volume (a new player has none, at 100)
      if (guild.effects && guild.effects.length) {
        body.effects = guild.effects;
      }
      if (guild.volume !== undefined && guild.volume !== 100) {
        body.volume = guild.volume;
      }
      if (guild.resumeAt) {
        // rejoined after a restart, the playing track carries on
        body.paused = guild.resumeAt.paused;
        body.position = guild.resumeAt.position;
        body.queueCurrent = true;
        guild.paused = guild.resumeAt.paused;
        guild.position = {at: Date.now(), value: guild.resumeAt.position};
        guild.movedAt = Date.now();
        guild.resumeAt = undefined;
        // a held one was left paused in the session
        this.editSession(guildId, guild, {paused: guild.paused, position: guild.position.value});
      }
    }
    if (guild.disconnected) {
      // joined again after being disconnected, the held track carries on
      body.paused = false;
      guild.disconnected = false;
      guild.paused = false;
      this.editSession(guildId, guild, {paused: false, position: (guild.position) ? guild.position.value : undefined});
    }
    if (guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
      guild.joinTimeout = null;
    }
    guild.node.updatePlayer(guildId, body).catch((error) => {
      console.warn(`voice node ${guild.node.info.name}`, error);
      this.leave(guildId);
    });
  }

  onEvent(node: NodeConnection, event: NodeEvent) {
    const { guildId } = event.data;
    const guild = this.guilds.get(guildId);
    // a node the guild moved off of (its player ending there)
    if (!guild || guild.node !== node) {
      return;
    }
    switch (event.op) {
      // the queue ran out (24/7 stays), or the node couldn't reach the api
      case 'QUEUE_END': {
        if (event.data.error) {
          this.leave(guildId);
        } else {
          this.queueEnded(guildId, guild).catch((error) => {
            console.warn(`voice node queue end ${guildId}`, error);
            this.leave(guildId);
          });
        }
      }; break;
      // a queue item that couldn't be converted or played (the api dropped it), its `music play` reply says so
      case 'TRACK_ERROR': {
        const queueItemId = event.data.track && event.data.track.queueItemId;
        const waiter = (queueItemId) ? this.trackErrorListeners.get(queueItemId) : undefined;
        if (queueItemId && waiter) {
          this.trackErrorListeners.delete(queueItemId);
          waiter.listener(event.data.error);
        }
      }; break;
      case 'TRACK_END': {
        const queueItemId = event.data.track && event.data.track.queueItemId;
        if (queueItemId) {
          this.trackErrorListeners.delete(queueItemId);
        }
      }; break;
      // paused too long (the node's `VOICE_PAUSE_TIMEOUT`), we leave with the track held for the next `music play`
      case 'PAUSE_TIMEOUT': {
        this.hold(guildId);
      }; break;
      // between tracks, a disabled node's guilds move to an enabled one (the track starts over there)
      // (the nodes are fetched again at most once a minute, so a node disabled on the dashboard is noticed)
      case 'TRACK_START': {
        // a track playing isn't idle, even if it was restored as idle between two tracks
        guild.idle = false;
        if (!guild.movedAt || PLAYER_UPDATE_INTERVAL * 2 < Date.now() - guild.movedAt) {
          guild.position = {at: Date.now(), value: 0};
        }
        this.resolveNextTrack(guildId, 'started');
        this.refreshNodes(guild.shard).then(() => {
          if (!node.info.enabled) {
            return this.moveGuild(guildId, 'drain');
          }
        }).catch((error) => console.warn(`voice node move ${guildId}`, error));
      }; break;
      // the node's voice connection is gone for good while we're still in the channel (a dropped session like after a
      // failover, failed reconnects, a close discord sent no new voice server after), new credentials only come from
      // leaving and joining again
      case 'VOICE_LOST': {
        this.rejoin(guildId, event.data.error);
      }; break;
    }
  }

  // the node's position for a guild's track every few seconds, kept for a failover
  onPlayerUpdate(node: NodeConnection, update: {guildId: string, position: number}) {
    const guild = this.guilds.get(update.guildId);
    if (guild && guild.node === node && typeof(update.position) === 'number') {
      guild.position = {at: Date.now(), value: update.position};
    }
  }

  // leave and join the same channel, discord gives us a new voice session and server, which goes to the node. One that
  // keeps losing it right after rejoining is left (the track held for the next play) instead of rejoining forever
  private rejoin(guildId: string, error: null | string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.channelId || guild.disconnected || guild.rejoinTimeout) {
      return;
    }
    const now = Date.now();
    const retry = !!guild.rejoinedAt && now - guild.rejoinedAt < REJOIN_RETRY_WINDOW;
    guild.rejoinTries = (retry) ? (guild.rejoinTries || 0) + 1 : 1;
    if (REJOIN_MAX_TRIES < guild.rejoinTries) {
      console.warn(`voice connection for ${guildId} keeps getting lost (${error || 'no error'}), leaving`);
      return (guild.idle) ? this.leave(guildId) : this.hold(guildId);
    }
    const channelId = guild.channelId;
    guild.rejoinedAt = now;
    guild.rejoining = true;
    console.warn(`voice connection for ${guildId} was lost (${error || 'no error'}), rejoining`);
    guild.shard.gateway.voiceStateUpdate(guildId, null);
    this.rejoinLater(guildId, guild, channelId);
  }

  private rejoinLater(guildId: string, guild: GuildVoice, channelId: string) {
    guild.rejoinTimeout = setTimeout(() => {
      guild.rejoinTimeout = null;
      if (this.guilds.get(guildId) === guild) {
        guild.shard.gateway.voiceStateUpdate(guildId, channelId, {selfDeaf: true});
      }
    }, 1000);
  }

  // where a guild's track got to on a node that's gone: its last known position, plus the time it kept playing after
  // that (until the node went down, at most one update's worth), nothing more when paused
  private estimatePosition(guild: GuildVoice, until: number): number {
    if (!guild.position) {
      return 0;
    }
    if (guild.paused) {
      return guild.position.value;
    }
    // an effect's speed plays more (or less) of the track each second
    const end = Math.min(until, guild.position.at + PLAYER_UPDATE_INTERVAL);
    return guild.position.value + Math.round(Math.max(0, end - guild.position.at) * (guild.speed || 1));
  }

  /**
   * A node went down (or restarted and lost our players): each of its guilds moves to the node with the fewest guilds,
   * a few at a time so they spread out. `downAt` is when it stopped, for where each track had got to
   */
  async failover(node: NodeConnection, reason: 'down' | 'restarted', downAt: number) {
    const guildIds = node.guildIds;
    if (!guildIds.length) {
      return;
    }
    console.warn(`voice node ${node.info.name} ${(reason === 'down') ? 'is down' : 'restarted'}, moving ${guildIds.length} servers`);
    for (let i = 0; i < guildIds.length; i += FAILOVER_BATCH) {
      await Promise.all(guildIds.slice(i, i + FAILOVER_BATCH).map((guildId) => {
        return this.moveGuild(guildId, reason, downAt).catch((error) => console.warn(`voice node failover ${guildId}`, error));
      }));
    }
  }

  /**
   * Moves a guild's player to the enabled node with the fewest guilds, like lavalink clients moving players between
   * nodes: the new node gets the same voice state (we stay in the channel, discord drops the old node's voice connection)
   * and takes the queue's playing item over from where it was (`queueCurrent`). Draining asks the old player where it is
   * and destroys it, a node that's down or restarted can't be asked, so it's the last known position. A guild stays put
   * when no other node can take it (a node that's down keeps being reconnected to until it gives up)
   */
  async moveGuild(guildId: string, reason: MoveReason, downAt: number = Date.now()): Promise<void> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.moving) {
      return;
    }
    const from = guild.node;
    // a node that's down isn't picked again, a restarted one can take its own guilds back
    const exclude = (reason === 'down') ? from : undefined;

    // still joining, nothing's on the node yet: the voice state goes to the new one when it comes
    if (guild.startQueue) {
      if (reason !== 'drain') {
        const to = await this.pickNode(guild.shard, exclude).catch(() => null);
        if (to && this.guilds.get(guildId) === guild) {
          guild.node = to;
        }
      }
      return;
    }

    // a disconnected one has no voice to send, the new node holds it paused like the old one did
    const { channelId, endpoint, sessionId, token } = guild;
    const voice = (channelId && endpoint && sessionId && token) ? {channelId, endpoint, sessionId, token} : null;
    if (!voice && !guild.disconnected) {
      return;
    }
    guild.moving = true;
    try {
      const to = await this.pickNode(guild.shard, exclude).catch(() => null);
      if (!to || this.guilds.get(guildId) !== guild || (reason === 'drain' && to === from)) {
        return;
      }

      let paused = !!guild.paused;
      let position: number;
      if (reason === 'drain') {
        const player = await from.getPlayer(guildId);
        position = (player) ? player.position || 0 : 0;
        paused = !!(player && player.paused);
      } else {
        position = this.estimatePosition(guild, downAt);
      }

      // events from here on are the old player ending, ignored
      guild.node = to;
      if (reason === 'drain') {
        await from.destroyPlayer(guildId).catch((error) => console.warn(`voice node ${from.info.name} destroy`, error));
      }
      try {
        await to.updatePlayer(guildId, {...(voice) ? {voice} : {}, effects: guild.effects || [], paused, position, queue: true, queueCurrent: true, volume: guild.volume ?? 100});
      } catch(error) {
        // nothing's playing it anymore, leave like a node that fails on join (the queue stays)
        console.warn(`voice node ${to.info.name} taking over ${guildId}`, error);
        if (this.guilds.get(guildId) === guild) {
          this.leave(guildId);
        }
        return;
      }
      guild.movedAt = Date.now();
      guild.paused = paused;
      guild.position = {at: Date.now(), value: position};
      if (voice) {
        this.editSession(guildId, guild, {nodeId: to.id, paused, position});
      }
      console.log(`voice node moved ${guildId} from ${from.info.name} to ${to.info.name} at ${position}ms (${reason})`);
    } finally {
      guild.moving = false;
    }
  }

  /**
   * The owner refresh is reloading this file: hands everything to the new instance (`adopt`) and stops this one, its
   * timers cleared and its node websockets closed without touching the players (the sessions are resuming, the nodes
   * keep them playing). We stay in the voice channels, the gateway isn't reloaded
   */
  detach(): VoiceNodeHandover {
    this.detached = true;
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
    const guilds = Array.from(this.guilds).map(([guildId, guild]) => {
      const { aloneTimeout, joinTimeout, rejoinTimeout } = guild;
      // a pending pause is checked again by the new instance's next voice state, it isn't carried over
      if (aloneTimeout) {
        clearTimeout(aloneTimeout);
      }
      if (joinTimeout) {
        clearTimeout(joinTimeout);
      }
      if (rejoinTimeout) {
        clearTimeout(rejoinTimeout);
      }
      // a copy, whatever this instance still has running (a command, a move) changes its own
      return {
        guild: {...guild, aloneTimeout: null, joinTimeout: null, moving: false, rejoinTimeout: null},
        guildId,
        joining: !!joinTimeout,
        nodeId: guild.node.id,
        rejoinPending: !!rejoinTimeout,
      };
    });
    const nodes = Array.from(this.nodes.values()).map((node) => ({
      disconnectedAt: node.disconnectedAt,
      failedAt: node.failedAt,
      info: node.info,
      reconnect: !!node.ws || !!node.reconnectTimeout || !!node.guildIds.length,
      restoring: !!node.restoring,
      sessionId: node.sessionId,
    }));
    const handover: VoiceNodeHandover = {
      closed: Promise.all(Array.from(this.nodes.values()).map((node) => node.detach())).then(() => {}),
      guilds,
      nodes,
      nodesFetchedAt: this.nodesFetchedAt,
      readyShards: Array.from(this.readyShards),
      recoveredSessions: Array.from(this.recoveredSessions),
      resumeDone: this.resumeDone,
      resumedPlayers: Array.from(this.resumedPlayers).map(([guildId, player]) => {
        return {channelId: player.channelId, effects: player.effects, guildId, idle: player.idle, nodeId: player.node.id, paused: player.paused, position: player.position, speed: player.speed, volume: player.volume};
      }),
      triedResume: this.triedResume,
    };
    // anything still running here finds nothing to act on
    this.guilds = new Map();
    this.nodes = new Map();
    this.recoveredSessions = new Map();
    this.resumedPlayers = new Map();
    return handover;
  }

  /**
   * Takes over from the instance before this file was reloaded (`detach`): the same guilds, still in their channels
   * with their voice state (nothing's left or rejoined), and the same node sessions, resumed once the old websockets
   * closed (`READY` with `resumed`). Also how the old instance comes back when the new file failed to load
   */
  adopt(cluster: ClusterClient, handover: VoiceNodeHandover) {
    this.cluster = cluster;
    this.detached = false;
    this.guilds = new Map();
    this.nodes = new Map();
    this.nodesFetchedAt = handover.nodesFetchedAt;
    this.readyShards = new Set(handover.readyShards);
    this.recoveredSessions = new Map(handover.recoveredSessions);
    this.resumeDone = handover.resumeDone;
    this.resumedPlayers = new Map();
    this.triedResume = handover.triedResume;

    for (const old of handover.nodes) {
      const node = new NodeConnection(this, old.info);
      node.disconnectedAt = old.disconnectedAt;
      node.failedAt = old.failedAt;
      // the players' routes keep working with the session id until the websocket's back. one still being restored
      // after a restart is asked again (its players aren't ours yet), resuming from the saved session id
      node.sessionId = (old.restoring) ? null : old.sessionId;
      this.nodes.set(node.id, node);
    }
    for (const { guild, guildId, joining, nodeId, rejoinPending } of handover.guilds) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        continue;
      }
      const adopted: GuildVoice = {...guild, aloneTimeout: null, joinTimeout: null, moving: false, node, rejoinTimeout: null};
      this.guilds.set(guildId, adopted);
      if (joining) {
        adopted.joinTimeout = setTimeout(() => this.leave(guildId), JOIN_TIMEOUT);
      }
      if (rejoinPending && adopted.channelId) {
        this.rejoinLater(guildId, adopted, adopted.channelId);
      }
    }
    for (const { guildId, nodeId, ...player } of handover.resumedPlayers) {
      const node = this.nodes.get(nodeId);
      if (node) {
        this.resumedPlayers.set(guildId, {...player, node});
      }
    }
    this.watchRecovered();

    const shard = cluster.shards.first();
    handover.closed.then(() => {
      if (!shard || this.detached) {
        return;
      }
      for (const old of handover.nodes) {
        const node = this.nodes.get(old.info.id);
        if (node && old.reconnect) {
          node.connect(shard.userId).catch((error) => console.warn(`voice node ${node.info.name} resume`, error));
        }
      }
      // reloaded while starting up, what's left of it
      if (this.triedResume && !this.resumeDone) {
        this.resumeSessions(shard);
      }
    });
  }
}

export default new VoiceNodeClient();
