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
  fetchMusicNodes,
  fetchMusicSessions,
  putGuildMusicQueue,
  putGuildMusicSession,
} from './api';
import { RestResponsesRaw } from './api/types';
import { RequestContext } from './api/raw';


// how long a node gets to answer the websocket, and discord to send our voice state/server after we join
const CONNECT_TIMEOUT = 10 * 1000;
const JOIN_TIMEOUT = 15 * 1000;
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
// a guild whose voice session discord dropped (4006) leaves and rejoins for new credentials, at most this often
const REJOIN_COOLDOWN = 30 * 1000;
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

export enum VoiceNodeEvents {
  // `{guildId}`, we left the channel (the queue ran out, we got disconnected or the node lost our players)
  LEFT = 'left',
}

interface GuildVoice {
  channelId?: string,
  endpoint?: string,
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
  // rejoined after a restart (from the api's music session): the queue starts with the playing track from here
  resumeAt?: {paused: boolean, position: number},
  // the node the guild's music is on, it stays there until we leave or it's disabled (then it moves between tracks)
  node: NodeConnection,
  sessionId?: string,
  shard: ShardClient,
  // turn on the node's queue mode with the first complete voice state (we just joined to play the queue)
  startQueue: boolean,
  token?: string,
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
      const ws = this.ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/v4/websocket', {
        handshakeTimeout: CONNECT_TIMEOUT,
        headers,
      });
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error(`The voice node ${this.info.name} didn't answer`));
      }, CONNECT_TIMEOUT);

      ws.on('ping', () => this.lastSeenAt = Date.now());
      ws.on('message', (data) => {
        this.lastSeenAt = Date.now();
        let payload: any;
        try {
          payload = JSON.parse(data.toString());
        } catch(error) {
          return;
        }
        if (payload.op === 'ready') {
          clearTimeout(timeout);
          this.onReady(ws, payload.sessionId, !!payload.resumed);
          resolve(payload.sessionId);
        } else if (payload.op === 'event') {
          this.client.onEvent(this, payload);
        } else if (payload.op === 'playerUpdate') {
          this.client.onPlayerUpdate(this, payload);
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
              this.client.leave(guildId);
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
            setTimeout(() => {
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
    this.request('PATCH', `/v4/sessions/${sessionId}`, {resuming: true, timeout: RESUME_TIMEOUT})
      .catch((error) => console.warn(`voice node ${this.info.name} resuming`, error));

    if (resumed) {
      // after a restart we don't know what's playing, the node does
      if (!previousId) {
        this.restoring = this.restorePlayers().catch((error) => console.warn(`voice node ${this.info.name} restore`, error));
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
    const players: Array<any> = await this.request('GET', `/v4/sessions/${this.sessionId}/players`);
    for (const player of players) {
      if (player.voice && player.voice.channelId) {
        this.client.resumedPlayers.set(player.guildId, {
          channelId: player.voice.channelId,
          node: this,
          paused: !!player.paused,
          position: (player.state) ? player.state.position || 0 : 0,
        });
      }
    }
    this.client.rejoinResumed();
  }

  private async dropMovedPlayers() {
    const players: Array<any> = await this.request('GET', `/v4/sessions/${this.sessionId}/players`);
    for (const player of players) {
      const guild = this.client.guilds.get(player.guildId);
      if (!guild || guild.node !== this) {
        await this.destroyPlayer(player.guildId).catch(() => {});
      }
    }
  }

  async updatePlayer(guildId: string, body: Record<string, unknown>): Promise<any> {
    return this.request('PATCH', `/v4/sessions/${this.sessionId}/players/${guildId}`, body);
  }

  async getPlayer(guildId: string): Promise<any> {
    if (!this.sessionId) {
      return null;
    }
    return this.request('GET', `/v4/sessions/${this.sessionId}/players/${guildId}`).catch(() => null);
  }

  async destroyPlayer(guildId: string): Promise<void> {
    if (this.sessionId) {
      await this.request('DELETE', `/v4/sessions/${this.sessionId}/players/${guildId}`);
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
 * notsobot.voice, the music nodes (a lavalink v4 subset that plays opus files), managed on the dashboard and given to
 * us by the api (`GET /music/nodes`). The music queue lives in the api (`/music/queue/<id>`), a node pulls the next
 * track from it itself, so here we only join/leave channels on our own gateway and forward our voice state and voice
 * server to the guild's node (see `listeners/voicenode.ts`). A guild goes on the node with the fewest of our guilds
 */
export class VoiceNodeClient extends EventSpewer {
  cluster: ClusterClient | null = null;
  guilds = new Map<string, GuildVoice>();
  nodes = new Map<string, NodeConnection>();
  nodesFetchedAt = 0;
  nodesFetching: null | Promise<void> = null;
  readyShards = new Set<number>();
  // players a node kept for us through a restart, rejoined once their shard is ready
  resumedPlayers = new Map<string, {channelId: string, node: NodeConnection, paused: boolean, position: number}>();
  // music sessions from the api that no node kept playing (it restarted too), rejoined once their server is loaded
  recoveredSessions = new Map<string, {loadedAt: number, session: RestResponsesRaw.MusicSession}>();
  recoveryInterval: null | ReturnType<typeof setInterval> = null;
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
      this.refreshNodes(shard, true).then(async () => {
        // the nodes first, they know exactly what they kept playing
        await Promise.all(Array.from(this.nodes.values()).filter((node) => node.readSavedSessionId()).map((node) => {
          return node.connect(shard.userId)
            .then(() => node.restoring)
            .catch((error) => console.warn(`voice node ${node.info.name} resume`, error));
        }));
        // then the api, for servers that were playing on a node that restarted too
        await this.loadSessions(shard);
      }).catch((error) => console.warn('voice nodes', error));
    }
    this.rejoinResumed();
    this.rejoinRecovered();
  }

  // the api's music sessions on our shards, every start (usually none): the ones the nodes didn't keep are rejoined
  private async loadSessions(shard: ShardClient) {
    const cluster = this.cluster;
    const shardIds = (cluster) ? Array.from(cluster.shards.keys()) : [shard.shardId];
    const shardCount = (cluster) ? cluster.shardCount : 1;
    const { sessions } = await fetchMusicSessions({client: shard}, {shardCount, shardIds});
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
    // their servers come in after the shard is ready
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

  // rejoins recovered sessions whose server is loaded, if someone's still in the channel to hear it
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
      const listening = (channel.isGuildVoice || channel.isGuildStageVoice) && channel.voiceStates.some((state) => {
        return state.userId !== shard.userId && !(state.member && state.member.bot);
      });
      if (!listening) {
        deleteGuildMusicSession({client: shard}, guildId).catch(() => {});
        continue;
      }
      this.recoverGuild(shard, guildId, channel.id, session)
        .catch((error) => console.warn(`voice node recover ${guildId}`, error));
    }
  }

  private async recoverGuild(shard: ShardClient, guildId: string, channelId: string, session: RestResponsesRaw.MusicSession) {
    const node = await this.pickNode(shard);
    if (this.guilds.has(guildId)) {
      return;
    }
    this.join(shard, guildId, channelId, true, node);
    const guild = this.guilds.get(guildId)!;
    // a track that would have ended by now isn't carried on, the queue starts with the next one
    if (!session.finished) {
      guild.resumeAt = {paused: session.paused, position: session.position};
    }
    console.log(`voice node rejoined ${guildId} on ${node.info.name} at ${(session.finished) ? 'the next track' : `${session.position}ms`}`);
  }

  // the restarted shard identified as a new session, so discord dropped us from voice: join again for the nodes'
  // players, they continue where they were held once the new voice state reaches them
  rejoinResumed() {
    for (const [guildId, { channelId, node, paused, position }] of Array.from(this.resumedPlayers)) {
      const shard = this.shardForGuild(guildId);
      if (!shard || !this.readyShards.has(shard.shardId)) {
        continue;
      }
      this.resumedPlayers.delete(guildId);
      this.join(shard, guildId, channelId, false, node);
      const guild = this.guilds.get(guildId);
      if (guild) {
        guild.paused = paused;
        guild.position = {at: Date.now(), value: position};
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
    putGuildMusicSession({client: shard}, guildId, {channelId, nodeId: node.id})
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
    result: RestResponsesRaw.MusicSearchResult,
    userId: string,
  ): Promise<{item: RestResponsesRaw.GuildMusicQueueItem, joined: boolean}> {
    const guild = this.guilds.get(guildId);
    const node = (guild) ? guild.node : await this.pickNode(shard);
    if (guild) {
      await node.connect(shard.userId);
    }
    const item = await putGuildMusicQueue(context, guildId, {track: result.track, url: result.url, userId});
    const joined = !this.guilds.has(guildId);
    if (joined) {
      this.join(shard, guildId, channelId, true, node);
    }
    return {item, joined};
  }

  isPlaying(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && !guild.startQueue;
  }

  // pausing keeps the voice connection and the track's position, null when nothing's playing in the guild
  async setPaused(guildId: string, paused: boolean): Promise<any> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {paused});
    guild.paused = paused;
    if (player && player.state) {
      guild.position = {at: Date.now(), value: player.state.position || 0};
    }
    this.editSession(guildId, guild, {paused, position: (guild.position) ? guild.position.value : undefined});
    return (player && player.track) ? player : null;
  }

  // `position` in milliseconds, past the end ends the track (and the queue goes on), null when nothing's playing
  async seek(guildId: string, position: number): Promise<any> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {position});
    guild.position = {at: Date.now(), value: position};
    this.editSession(guildId, guild, {position});
    return (player && player.track) ? player : null;
  }

  // ends the track, the node goes on with the next queued item (or the queue ends and we leave). The node keeps
  // `paused` across tracks, so it's unpaused too
  async skip(guildId: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild || !this.isPlaying(guildId)) {
      return false;
    }
    await guild.node.updatePlayer(guildId, {paused: false, track: {encoded: null}});
    guild.paused = false;
    this.editSession(guildId, guild, {paused: false});
    return true;
  }

  // the guild's player on its node (`{paused, state: {connected, ping, position}, track, ...}`), null when there's none
  async getPlayer(guildId: string): Promise<any> {
    const guild = this.guilds.get(guildId);
    return (guild) ? guild.node.getPlayer(guildId) : null;
  }

  // `clearQueue` empties the api's queue too, for leaving on purpose (not when the node lost our players)
  leave(guildId: string, clearQueue: boolean = false) {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return;
    }
    this.guilds.delete(guildId);
    if (guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
    }
    guild.shard.gateway.voiceStateUpdate(guildId, null);
    guild.node.destroyPlayer(guildId).catch(() => {});
    if (clearQueue) {
      // the session goes with it
      deleteGuildMusic({client: guild.shard}, guildId).catch((error) => console.warn('voice node clear queue', error));
    } else {
      deleteGuildMusicSession({client: guild.shard}, guildId).catch((error) => console.warn('voice node session', error));
    }
    this.emit(VoiceNodeEvents.LEFT, {guildId});
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
      return this.leave(guildId, true);
    }
    if (guild.channelId && guild.channelId !== channelId) {
      // someone dragged us to another channel
      this.editSession(guildId, guild, {channelId});
    }
    guild.channelId = channelId;
    guild.sessionId = sessionId;
    this.forwardVoice(guildId, guild);
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
      if (guild.resumeAt) {
        // rejoined after a restart, the playing track carries on
        body.paused = guild.resumeAt.paused;
        body.position = guild.resumeAt.position;
        body.queueCurrent = true;
        guild.paused = guild.resumeAt.paused;
        guild.position = {at: Date.now(), value: guild.resumeAt.position};
        guild.movedAt = Date.now();
        guild.resumeAt = undefined;
      }
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

  onEvent(node: NodeConnection, payload: {guildId: string, type: string}) {
    const guild = this.guilds.get(payload.guildId);
    // a node the guild moved off of (its player ending there)
    if (!guild || guild.node !== node) {
      return;
    }
    switch (payload.type) {
      // the queue ran out (or the node couldn't reach the api)
      case 'QueueEndEvent': {
        this.leave(payload.guildId);
      }; break;
      // paused too long (the node's `VOICE_PAUSE_TIMEOUT`), like the leave command
      case 'PauseTimeoutEvent': {
        this.leave(payload.guildId, true);
      }; break;
      // between tracks, a disabled node's guilds move to an enabled one (the track starts over there)
      // (the nodes are fetched again at most once a minute, so a node disabled on the dashboard is noticed)
      case 'TrackStartEvent': {
        if (!guild.movedAt || PLAYER_UPDATE_INTERVAL * 2 < Date.now() - guild.movedAt) {
          guild.position = {at: Date.now(), value: 0};
        }
        this.refreshNodes(guild.shard).then(() => {
          if (!node.info.enabled) {
            return this.moveGuild(payload.guildId, 'drain');
          }
        }).catch((error) => console.warn(`voice node move ${payload.guildId}`, error));
      }; break;
      // discord dropped the voice session (4006, like after a failover where the old credentials didn't carry over),
      // new ones only come from leaving and joining again
      case 'WebSocketClosedEvent': {
        if ((payload as any).code === 4006) {
          this.rejoin(payload.guildId);
        }
      }; break;
    }
  }

  // the node's position for a guild's track every few seconds, kept for a failover
  onPlayerUpdate(node: NodeConnection, payload: {guildId: string, state?: {position?: number}}) {
    const guild = this.guilds.get(payload.guildId);
    if (guild && guild.node === node && payload.state && typeof(payload.state.position) === 'number') {
      guild.position = {at: Date.now(), value: payload.state.position};
    }
  }

  // leave and join the same channel, discord gives us a new voice session and server, which goes to the node
  private rejoin(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.channelId || (guild.rejoinedAt && Date.now() - guild.rejoinedAt < REJOIN_COOLDOWN)) {
      return;
    }
    const channelId = guild.channelId;
    guild.rejoinedAt = Date.now();
    guild.rejoining = true;
    console.warn(`voice session for ${guildId} was dropped, rejoining`);
    guild.shard.gateway.voiceStateUpdate(guildId, null);
    setTimeout(() => {
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
    const end = Math.min(until, guild.position.at + PLAYER_UPDATE_INTERVAL);
    return guild.position.value + Math.max(0, end - guild.position.at);
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

    const { channelId, endpoint, sessionId, token } = guild;
    if (!channelId || !endpoint || !sessionId || !token) {
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
        position = (player && player.state) ? player.state.position || 0 : 0;
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
        await to.updatePlayer(guildId, {voice: {channelId, endpoint, sessionId, token}, paused, position, queue: true, queueCurrent: true});
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
      this.editSession(guildId, guild, {nodeId: to.id, paused, position});
      console.log(`voice node moved ${guildId} from ${from.info.name} to ${to.info.name} at ${position}ms (${reason})`);
    } finally {
      guild.moving = false;
    }
  }
}

export default new VoiceNodeClient();
