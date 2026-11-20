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
import { log } from './log';


// how long a node gets to answer the websocket, and discord to send our voice state/server after we join
const CONNECT_TIMEOUT = 10 * 1000;
const JOIN_TIMEOUT = 15 * 1000;
// how long a node gets to answer our close when this file is reloaded, then the socket's just dropped
const CLOSE_TIMEOUT = 3 * 1000;
// a node that accepts the connection but never answers a rest request used to hang the command until its interaction expired
const REQUEST_TIMEOUT = 10 * 1000;
// how long a node keeps our players playing after our websocket closes (we restarted), in seconds
const RESUME_TIMEOUT = 120;
const RECONNECT_DELAY = 2000;
// the node closed our websocket because another websocket resumed our session (see `NodeConnection.lost`)
const NODE_CLOSE_REPLACED = 4000;
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
// how long after leaving a rejoin joins again
const REJOIN_DELAY = 1000;
// with `pause_alone`, how long nobody else has to be listening before it pauses (a connection blipping)
const ALONE_PAUSE_DELAY = 5 * 1000;
// without 24/7, how long we stay in the channel after the queue runs out (a play in the meantime carries on) before leaving
const IDLE_LEAVE_DELAY = 2 * 60 * 1000;
// how long a play that joined (or started an idle queue again) waits for the first track to start (a link converts
// first), its reply is shown again after
const JOINED_START_TIMEOUT = 30 * 1000;
// after starting, how long a music session from the api waits for its server to load before it's given up on, and
// how often the waiting ones are looked at
const RECOVER_WAIT = 60 * 1000;
const RECOVER_INTERVAL = 5 * 1000;
// how long a `music play` reply waits to hear its queue item failed. A 24/7 queue never leaves (which drops them), and
// a reply this old is long out of view
const TRACK_ERROR_LISTEN_FOR = 6 * 60 * 60 * 1000;
// a listen (`listen`) the node never ended is given up on this long after its duration (a node from before listening
// ignores `listen`, one that went away can't say)
const LISTEN_END_GRACE = 15 * 1000;
// after asking the node to stop, this long for its `LISTEN_END`
const LISTEN_STOP_WAIT = 5 * 1000;

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
  {op: 'VOICE_LOST', data: {error: null | string, guildId: string}} |
  // a listen's last few seconds of audio (a base64 ogg opus file) every few seconds of new audio, then its end. `userId`
  // is null when it's listening to everyone
  {op: 'LISTEN_AUDIO', data: {audio: string, duration: number, guildId: string, heard: number, userId: null | string}} |
  {op: 'LISTEN_END', data: {guildId: string, heard: number, reason: string, userId: null | string}};

// why a listen ended: the node's (`stopped` when we asked, `time` its duration ran out, `voice` its voice connection
// went, `replaced`, `destroyed`, `failed` it couldn't mix everyone), `left` when we left the channel, `timeout` when the
// node never said
export type ListenEndReason = 'destroyed' | 'failed' | 'left' | 'replaced' | 'stopped' | 'time' | 'timeout' | 'voice';

export interface ListenHandlers {
  // the latest few seconds of their audio, an ogg opus file
  onAudio: (audio: Buffer, heard: number) => void,
  onEnd: (reason: ListenEndReason) => void,
}

// a guild's listen, one at a time. `timeout` gives up on it if the node never ends it
interface GuildListen extends ListenHandlers {
  stopping: boolean,
  timeout: null | ReturnType<typeof setTimeout>,
  // who it's listening to, null for everyone
  userId: null | string,
}

// why `listen` can't start: we're playing in another channel of the server (or held after being disconnected from
// one), or someone's being listened to already
export class VoiceListenError extends Error {
  channelId: null | string;
  reason: 'busy' | 'elsewhere';

  constructor(reason: 'busy' | 'elsewhere', channelId: null | string = null) {
    super((reason === 'busy') ? 'Already listening in this server' : 'Playing in another voice channel');
    this.channelId = channelId;
    this.reason = reason;
  }
}

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
  // how fast the effects and the tempo play it, 1 without either
  speed: number,
  // percent of the track's own tempo (its pitch kept), 100 is the file as it is. Missing from a node older than it
  tempo?: number,
  track: null | {length: number, queueItemId: null | string, title: string, url: string},
  voice: null | {channelId: string, endpoint: string, sessionId: string, token: string},
  // percent, 100 sends the file as it is
  volume: number,
}

export enum VoiceNodeEvents {
  // `{guildId}`, we left the channel (the queue ran out, we got disconnected or the node lost our players)
  LEFT = 'left',
}

type Timer = ReturnType<typeof setTimeout>;

// who paused the playing track: nobody, someone (a command, the dashboard, a restart that found it paused), or
// `pause_alone` (nobody else could hear it, someone listening again carries on, pausing or resuming by hand takes over)
export type PauseState = 'none' | 'user' | 'alone';

/**
 * What a guild's music is doing, exactly one at a time (`setPhase` clears the timers of the one it leaves):
 * - starting: we joined to start the node's queue and wait for our voice state and server, nothing's on the node yet
 *   (`forwardVoice` starts it). `resumeAt` carries a held or recovered track on from where it was
 * - playing: the node's queue is going, a track playing (or between two). `pause` is what we last told the node (set
 *   before it answers, put back if it fails), `aloneTimeout` pauses it when nobody else is listening. `started` is
 *   false from starting the queue until the node's first TRACK_START, a start that failed before one goes back to idle
 * - idle: the queue ran out and we stay in the channel, the next play starts the node's queue again. For good on 24/7,
 *   otherwise until `leaveTimeout`
 * - disconnected: someone disconnected us (or deleted the channel), the node holds the track paused without voice and
 *   the queue stays. Playing or resuming joins again and carries on, the node's pause timeout holds it in the api
 * Leaving isn't a phase, a guild that left is out of `guilds` (a callback holding the old object checks it's still the
 * one there). What runs alongside a phase stays out of it, a phase change doesn't end them: the join waiting for
 * discord (`joinTimeout`, a rejoined player's queue can run out meanwhile), a VOICE_LOST rejoin (`rejoin`) and a move to
 * another node (`moving`, playing or disconnected stay what they were on the new node)
 */
type GuildPhase =
  {name: 'starting', resumeAt: null | {pause: PauseState, position: number}} |
  {name: 'playing', aloneTimeout: null | Timer, pause: PauseState, started: boolean} |
  {name: 'idle', leaveTimeout: null | Timer} |
  {name: 'disconnected'};

/**
 * A VOICE_LOST rejoin: leave and join the same channel, discord gives us a new voice session and server for the node.
 * - leaving: we left on purpose, the join goes out after `REJOIN_DELAY` (`timeout`). Voice states and servers from
 *   before our leave are ignored, the voice credentials were cleared with it
 * - awaitingVoice: joined again, waiting for the new voice state and server (`forwardVoice`), `timeout` holds the track
 *   after `JOIN_TIMEOUT` like a join that never got its voice
 * - done: back in voice (or disconnected meanwhile), kept so losing voice again within `REJOIN_RETRY_WINDOW` of `since`
 *   counts as another try
 * `left` is our leave's voice state (no channel) having come in, discord doesn't always send it before the join goes
 * out. Until it does a voice state without a channel is ours, after it (or the join's own voice state) it's someone
 * disconnecting us
 */
export type RejoinStage = 'leaving' | 'awaitingVoice' | 'done';

interface GuildRejoin {
  left: boolean,
  // when this rejoin left
  since: number,
  stage: RejoinStage,
  timeout: null | Timer,
  // rejoins in a row that lost the connection again within `REJOIN_RETRY_WINDOW`
  tries: number,
}

class GuildVoice {
  // the channel it's playing in (the last one while disconnected)
  channelId?: string;
  // the node's stacked live effects (`MusicEffects`) and how fast it plays the track with them, what we last told it. A
  // failover and the owner refresh keep them, they go when we leave
  effects?: Array<string>;
  endpoint?: string;
  // we asked discord to join (or join again), leaving when our voice state and server don't come in time
  joinTimeout: null | Timer = null;
  // when it last moved, the new node's track start is the same track carrying on (not a new one at 0)
  movedAt?: number;
  // a move to another node is queued or running (`moveGuild`), another one isn't queued behind it
  moving = false;
  // the node the guild's music is on, it stays there until we leave or it's disabled (then it moves between tracks)
  node: NodeConnection;
  // requests to the node's player go one after another (`playerOp`)
  ops: Promise<void> = Promise.resolve();
  phase: GuildPhase;
  // the track's last known position (the node's `playerUpdate`s, a seek, a new track) and when it was, for a failover
  position?: {at: number, value: number};
  rejoin: null | GuildRejoin = null;
  sessionId?: string;
  shard: ShardClient;
  speed?: number;
  // the node's tempo (percent, the pitch kept, 100 or none is the file as it is), kept like `volume`
  tempo?: number;
  token?: string;
  // the node's volume (percent, 100 or none is the file as it is), kept like `effects`
  volume?: number;

  constructor(shard: ShardClient, node: NodeConnection, phase: GuildPhase) {
    this.node = node;
    this.phase = phase;
    this.shard = shard;
  }

  // the rest is read by the music commands, what the flags before `phase` said

  // pausing alone is ours, a listener coming back undoes it
  get alonePaused(): boolean {
    return this.phase.name === 'playing' && this.phase.pause === 'alone';
  }

  get disconnected(): boolean {
    return this.phase.name === 'disconnected';
  }

  get idle(): boolean {
    return this.phase.name === 'idle';
  }

  // null idle on 24/7 (we stay for good)
  get idleTimeout(): null | Timer {
    return (this.phase.name === 'idle') ? this.phase.leaveTimeout : null;
  }

  // a disconnected one is held paused, a starting one isn't (its `resumeAt` says how it starts)
  get paused(): boolean {
    return (this.phase.name === 'playing') ? this.phase.pause !== 'none' : this.phase.name === 'disconnected';
  }

  // starting: where a held or recovered track carries on from
  get resumeAt(): undefined | {paused: boolean, position: number} {
    if (this.phase.name !== 'starting' || !this.phase.resumeAt) {
      return undefined;
    }
    return {paused: this.phase.resumeAt.pause !== 'none', position: this.phase.resumeAt.position};
  }
}

function pauseState(paused: boolean, alone: boolean): PauseState {
  return (paused) ? ((alone) ? 'alone' : 'user') : 'none';
}


/*
 * The owner refresh hands guilds from the loaded voicenode.ts to the reloaded one as plain objects. The code before
 * `phase` (still deployed, and what a rollback goes back to) only reads and writes these flags, so a handover always
 * carries them, worked out from the phase. This code's own snapshot rides along and wins while it still says the same
 */

// the flags a guild had before `phase` and `rejoin` (startQueue, idle and disconnected exclude each other, `paused` is
// what we told the node and `alonePaused` that `pause_alone` did it), and its handover entry's timers that were running
export interface LegacyGuildFlags {
  alonePaused?: boolean,
  disconnected?: boolean,
  idle?: boolean,
  idleLeaving?: boolean,
  paused?: boolean,
  rejoinedAt?: number,
  rejoining?: boolean,
  rejoinPending?: boolean,
  rejoinTries?: number,
  resumeAt?: {paused: boolean, position: number},
  startQueue?: boolean,
}

// a phase and rejoin without their timers (`idle.leaving`: its leave timer was running)
export type GuildPhaseSnapshot =
  {name: 'starting', resumeAt: null | {pause: PauseState, position: number}} |
  {name: 'playing', pause: PauseState, started: boolean} |
  {name: 'idle', leaving: boolean} |
  {name: 'disconnected'};

export interface GuildRejoinSnapshot {
  left: boolean,
  since: number,
  stage: RejoinStage,
  tries: number,
}

export function phaseFromLegacy(flags: LegacyGuildFlags): GuildPhaseSnapshot {
  // the old `isDisconnected` won over the rest
  if (flags.disconnected) {
    return {name: 'disconnected'};
  }
  if (flags.idle) {
    return {name: 'idle', leaving: !!flags.idleLeaving};
  }
  if (flags.startQueue) {
    const resumeAt = flags.resumeAt;
    return {name: 'starting', resumeAt: (resumeAt) ? {pause: pauseState(!!resumeAt.paused, !!flags.alonePaused), position: resumeAt.position} : null};
  }
  // a pause alone still on its way to the node (`alonePaused` without `paused`) wasn't one yet
  return {name: 'playing', pause: pauseState(!!flags.paused, !!flags.alonePaused), started: true};
}

// `now` tells an old `rejoining` that's just waiting for its leave's voice state from one stuck because it never came
export function rejoinFromLegacy(flags: LegacyGuildFlags, now: number): null | GuildRejoinSnapshot {
  if (!flags.rejoinedAt) {
    return null;
  }
  const rejoin = {left: !flags.rejoining, since: flags.rejoinedAt, tries: flags.rejoinTries || 1};
  if (flags.rejoinPending) {
    return {...rejoin, stage: 'leaving'};
  }
  // joined again without the leave's voice state yet (so the join's isn't in either)
  if (flags.rejoining && now - flags.rejoinedAt < REJOIN_DELAY + JOIN_TIMEOUT) {
    return {...rejoin, stage: 'awaitingVoice'};
  }
  return {...rejoin, left: true, stage: 'done'};
}

export function legacyFromState(phase: GuildPhaseSnapshot, rejoin: null | GuildRejoinSnapshot): LegacyGuildFlags {
  const flags: LegacyGuildFlags = {
    alonePaused: false,
    disconnected: false,
    idle: false,
    idleLeaving: false,
    paused: false,
    rejoinedAt: undefined,
    rejoining: false,
    rejoinPending: false,
    rejoinTries: undefined,
    resumeAt: undefined,
    startQueue: false,
  };
  switch (phase.name) {
    case 'starting': {
      flags.startQueue = true;
      if (phase.resumeAt) {
        flags.alonePaused = phase.resumeAt.pause === 'alone';
        flags.resumeAt = {paused: phase.resumeAt.pause !== 'none', position: phase.resumeAt.position};
      }
    }; break;
    case 'playing': {
      flags.alonePaused = phase.pause === 'alone';
      flags.paused = phase.pause !== 'none';
    }; break;
    case 'idle': {
      flags.idle = true;
      flags.idleLeaving = phase.leaving;
    }; break;
    case 'disconnected': {
      flags.disconnected = flags.paused = true;
    }; break;
  }
  if (rejoin) {
    flags.rejoinedAt = rejoin.since;
    flags.rejoinTries = rejoin.tries;
    // the old code joins again a second after adopting one that was still leaving
    flags.rejoinPending = rejoin.stage === 'leaving';
    flags.rejoining = rejoin.stage !== 'done' && !rejoin.left;
  }
  return flags;
}

function sameLegacyFlags(x: LegacyGuildFlags, y: LegacyGuildFlags): boolean {
  const booleans = ['alonePaused', 'disconnected', 'idle', 'idleLeaving', 'paused', 'rejoining', 'rejoinPending', 'startQueue'] as const;
  if (booleans.some((key) => !!x[key] !== !!y[key])) {
    return false;
  }
  if ((x.rejoinedAt || null) !== (y.rejoinedAt || null) || (x.rejoinTries || null) !== (y.rejoinTries || null)) {
    return false;
  }
  if (!x.resumeAt || !y.resumeAt) {
    return !x.resumeAt === !y.resumeAt;
  }
  return !!x.resumeAt.paused === !!y.resumeAt.paused && x.resumeAt.position === y.resumeAt.position;
}

// a handed-over guild's phase and rejoin: its snapshot while the flags still say the same (a rollback in between
// changes the flags but carries the snapshot along untouched), otherwise from the flags. `fromFlags` when it was
export function stateFromHandover(guild: LegacyGuildFlags & {phase?: GuildPhaseSnapshot, rejoin?: null | GuildRejoinSnapshot}, now: number): {
  fromFlags: boolean,
  phase: GuildPhaseSnapshot,
  rejoin: null | GuildRejoinSnapshot,
} {
  if (guild.phase && guild.rejoin !== undefined && sameLegacyFlags(legacyFromState(guild.phase, guild.rejoin), guild)) {
    return {fromFlags: false, phase: guild.phase, rejoin: guild.rejoin};
  }
  return {fromFlags: true, phase: phaseFromLegacy(guild), rejoin: rejoinFromLegacy(guild, now)};
}

function snapshotPhase(phase: GuildPhase): GuildPhaseSnapshot {
  switch (phase.name) {
    case 'starting': return {name: 'starting', resumeAt: (phase.resumeAt) ? {...phase.resumeAt} : null};
    case 'playing': return {name: 'playing', pause: phase.pause, started: phase.started};
    case 'idle': return {name: 'idle', leaving: !!phase.leaveTimeout};
    case 'disconnected': return {name: 'disconnected'};
  }
}

// timers aren't in a snapshot, the adopting instance starts them again
function phaseFromSnapshot(phase: GuildPhaseSnapshot): GuildPhase {
  switch (phase.name) {
    case 'starting': return {name: 'starting', resumeAt: (phase.resumeAt) ? {...phase.resumeAt} : null};
    case 'playing': return {name: 'playing', aloneTimeout: null, pause: phase.pause, started: phase.started};
    case 'idle': return {name: 'idle', leaveTimeout: null};
    case 'disconnected': return {name: 'disconnected'};
  }
}

// a guild handed over (`VoiceNodeHandover`): the legacy flags for the code before phases (it spreads this object and
// sets its own timers to null), the snapshot for this code. Only plain values, the old code's `GuildVoice` fields
export type HandoverGuild = LegacyGuildFlags & {
  aloneTimeout: null,
  channelId?: string,
  effects?: Array<string>,
  endpoint?: string,
  idleTimeout: null,
  joinTimeout: null,
  movedAt?: number,
  moving: false,
  node: NodeConnection,
  phase?: GuildPhaseSnapshot,
  position?: {at: number, value: number},
  rejoin?: null | GuildRejoinSnapshot,
  rejoinTimeout: null,
  sessionId?: string,
  shard: ShardClient,
  speed?: number,
  startQueue: boolean,
  tempo?: number,
  token?: string,
  volume?: number,
};

/**
 * What a reloaded voicenode.ts (the owner refresh) takes over from the instance before it: made by the old code's
 * `detach`, read by the new code's `adopt`, so a change here has to be read the old way too until the next restart.
 * Timers aren't carried over, only whether they were running
 */
export interface VoiceNodeHandover {
  // every old websocket closed, a node only resumes a session that has no websocket
  closed: Promise<void>,
  guilds: Array<{guild: HandoverGuild, guildId: string, idleLeaving?: boolean, joining: boolean, nodeId: string, rejoinPending: boolean}>,
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
  resumedPlayers: Array<{channelId: null | string, effects?: Array<string>, guildId: string, idle?: boolean, nodeId: string, paused: boolean, position: number, speed?: number, tempo?: number, volume?: number}>,
  triedResume: boolean,
}


/**
 * A node's websocket, one at a time (`enter` clears the timers of the one it leaves):
 * - closed: none, and nothing to reconnect for (never connected, or it closed with none of our guilds on it)
 * - connecting: opening one (`connect`), its READY resolves `ready`, `CONNECT_TIMEOUT` terminates it
 * - open: READY came, the watchdog terminates one the node stopped answering on
 * - reconnecting: it closed with guilds on it, the next try's in `RECONNECT_DELAY`
 * - retired: this instance is done with the node (the file was reloaded, or the node was deleted), it never connects
 *   again. The reloaded instance (or the node's next entry) has its own connection, two websockets resuming one
 *   session would have the node close the other (`NODE_CLOSE_REPLACED`)
 */
type NodeSocket =
  {name: 'closed'} |
  {name: 'connecting', ready: Promise<string>, timeout: Timer, ws: WebSocket} |
  {name: 'open', watchdog: ReturnType<typeof setInterval>, ws: WebSocket} |
  {name: 'reconnecting', timeout: Timer} |
  {name: 'retired'};

/**
 * One music node's websocket and session. The session is resumable: when we restart, the node keeps our players playing
 * (holding them while voice is gone), we reconnect with the session id we saved for it and rejoin their channels
 */
export class NodeConnection {
  client: VoiceNodeClient;
  // when connecting last failed, the node is skipped when picking one for a bit
  failedAt: null | number = null;
  info: RestResponsesRaw.MusicNode;
  // the last thing we heard from it (a message or its ping)
  lastSeenAt = 0;
  // since the websocket was lost, until the next READY: reconnecting stops once the node would have dropped our players
  // anyway, and its guilds move to another node after `FAILOVER_DELAY`. Not in `state`, it spans the reconnect tries
  outage: null | {failoverTimeout: null | Timer, since: number} = null;
  // asking a resumed session's players after we restarted, the api's music sessions wait for it
  restoring: null | Promise<void> = null;
  // the node said it keeps our players when the websocket closes
  resuming = false;
  // the session we have on the node, kept while reconnecting (it's resumed, the player routes keep working with it)
  sessionId: null | string = null;
  state: NodeSocket = {name: 'closed'};

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

  get ws(): null | WebSocket {
    return (this.state.name === 'connecting' || this.state.name === 'open') ? this.state.ws : null;
  }

  get disconnectedAt(): null | number {
    return (this.outage) ? this.outage.since : null;
  }

  get isConnected(): boolean {
    return this.state.name === 'open' && !!this.sessionId && this.state.ws.readyState === WebSocket.OPEN;
  }

  // connected, or worth trying: never failed, or failed long enough ago
  get isAvailable(): boolean {
    return this.isConnected || !this.failedAt || NODE_RETRY_AFTER < Date.now() - this.failedAt;
  }

  // the client's own entry for the node, not one it replaced (a reload, the node deleted and added again)
  get isCurrent(): boolean {
    return this.state.name !== 'retired' && !this.client.detached && this.client.nodes.get(this.id) === this;
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

  private enter(state: NodeSocket) {
    const old = this.state;
    // retired for good
    if (old.name === 'retired') {
      return;
    }
    switch (old.name) {
      case 'connecting': clearTimeout(old.timeout); break;
      case 'open': clearInterval(old.watchdog); break;
      case 'reconnecting': clearTimeout(old.timeout); break;
    }
    this.state = state;
  }

  private endOutage() {
    if (this.outage && this.outage.failoverTimeout) {
      clearTimeout(this.outage.failoverTimeout);
    }
    this.outage = null;
  }

  connect(userId: string): Promise<string> {
    // reloaded (or the node was deleted), the one that replaced this has its own connection
    if (!this.isCurrent) {
      return Promise.reject(new Error('Music was just reloaded, try again'));
    }
    if (this.isConnected) {
      return Promise.resolve(this.sessionId!);
    }
    if (this.state.name === 'connecting') {
      return this.state.ready;
    }

    const headers: Record<string, string> = {authorization: this.info.password, 'client-name': 'notsobot', 'user-id': userId};
    const resumeId = this.sessionId || this.readSavedSessionId();
    if (resumeId) {
      headers['session-id'] = resumeId;
    }

    // one that's still closing (open, its close not in yet) goes: its close is ignored once it isn't ours, and the node
    // would close it for the new one anyway
    const lingering = this.ws;
    if (lingering) {
      this.outage = this.outage || {failoverTimeout: null, since: Date.now()};
    }

    let resolveReady!: (sessionId: string) => void;
    let rejectReady!: (error: Error) => void;
    const ready = new Promise<string>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/websocket', {
      handshakeTimeout: CONNECT_TIMEOUT,
      headers,
    });
    const timeout = setTimeout(() => {
      rejectReady(new Error(`The voice node ${this.info.name} didn't answer`));
      ws.terminate();
    }, CONNECT_TIMEOUT);
    this.enter({name: 'connecting', ready, timeout, ws});
    if (lingering) {
      lingering.terminate();
    }

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
          this.onReady(ws, message.data.sessionId, !!message.data.resumed);
          resolveReady(message.data.sessionId);
        }; break;
        case 'PLAYER_UPDATE': {
          this.client.onPlayerUpdate(this, message.data);
        }; break;
        default: {
          this.client.onEvent(this, message);
        };
      }
    });
    ws.on('close', (code) => {
      rejectReady(new Error(`The voice node ${this.info.name} connection closed`));
      if (this.ws === ws) {
        this.lost(code, userId);
      }
    });
    ws.on('error', (error) => log.warn(`voice node ${this.info.name}`, error));
    return ready;
  }

  // the websocket closed (or never opened): reconnect while guilds are on it (the node keeps their players for a bit),
  // move them to another node if it stays down, or drop them once the node would have dropped their players anyway
  private lost(code: number, userId: string) {
    if (code === NODE_CLOSE_REPLACED) {
      // another websocket resumed our session. Only this cluster has its id (the tmp file is per cluster and per
      // container) and detritus starts a cluster's next process once the last one exited, so it was a second
      // connection in this process: an entry this instance replaced, or the instance before a reload (`isCurrent` stops
      // those now). Whoever has the session has its players, it isn't resumed again (that would take turns with it):
      // a new session's READY puts our guilds on new players (`failover` 'restarted'), or they fail over meanwhile
      log.warn(`voice node ${this.info.name} session was resumed by another connection, starting a new one`);
      this.forgetSession();
    }
    this.failedAt = Date.now();
    this.outage = this.outage || {failoverTimeout: null, since: Date.now()};
    const outage = this.outage;
    // nothing could take them (no other node up), the node would have dropped them by now anyway
    if (RESUME_TIMEOUT * 1000 < Date.now() - outage.since) {
      for (const guildId of this.guildIds) {
        this.client.nodeLost(guildId, outage.since);
      }
    }
    if (!this.guildIds.length) {
      this.enter({name: 'closed'});
      return;
    }
    // a short blip resumes (the node kept playing), a node still gone after a few seconds has its guilds moved
    if (!outage.failoverTimeout) {
      const wait = Math.max(0, FAILOVER_DELAY - (Date.now() - outage.since));
      outage.failoverTimeout = setTimeout(() => {
        outage.failoverTimeout = null;
        if (this.outage === outage && !this.isConnected && this.isCurrent) {
          this.client.failover(this, 'down', outage.since);
        }
      }, wait);
    }
    // the node keeps our players for a bit, reconnect while there's anything to keep
    this.enter({
      name: 'reconnecting',
      timeout: setTimeout(() => {
        this.connect(userId).catch((error) => log.warn(`voice node ${this.info.name} reconnect`, error));
      }, RECONNECT_DELAY),
    });
  }

  // a session another websocket took isn't resumed again, the next connect starts a new one
  private forgetSession() {
    const sessionId = this.sessionId;
    this.resuming = false;
    this.sessionId = null;
    if (this.sessionFile && sessionId && this.readSavedSessionId() === sessionId) {
      try {
        fs.unlinkSync(this.sessionFile);
      } catch(error) {
        log.warn('voice node session file', error);
      }
    }
  }

  private onReady(ws: WebSocket, sessionId: string, resumed: boolean) {
    const previousId = this.sessionId;
    const downAt = this.disconnectedAt;
    this.endOutage();
    this.failedAt = null;
    this.lastSeenAt = Date.now();
    this.resuming = false;
    this.sessionId = sessionId;
    // a node that froze (no ping, no messages) never closes the websocket itself
    this.enter({
      name: 'open',
      watchdog: setInterval(() => {
        if (this.ws === ws && NODE_SILENT_TIMEOUT < Date.now() - this.lastSeenAt) {
          log.warn(`voice node ${this.info.name} stopped answering`);
          ws.terminate();
        }
      }, 10 * 1000),
      ws,
    });
    if (this.sessionFile) {
      try {
        fs.writeFileSync(this.sessionFile, sessionId);
      } catch(error) {
        log.warn('voice node session file', error);
      }
    }
    this.request('PATCH', `/sessions/${sessionId}`, {resuming: true, timeout: RESUME_TIMEOUT})
      .then(() => this.resuming = this.sessionId === sessionId)
      .catch((error) => log.warn(`voice node ${this.info.name} resuming`, error));

    if (resumed) {
      // after a restart we don't know what's playing, the node does
      if (!previousId) {
        this.restoring = this.restorePlayers()
          .catch((error) => log.warn(`voice node ${this.info.name} restore`, error))
          .finally(() => this.restoring = null);
      } else {
        // back after a failover moved some of its guilds, their old players here go
        this.dropMovedPlayers().catch((error) => log.warn(`voice node ${this.info.name} cleanup`, error));
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
          tempo: player.tempo ?? 100,
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

  // this file is being reloaded (or the node was deleted): stops its timers and closes the websocket without touching
  // the players (the session is resuming, the node keeps them playing), resolves once it's closed for the next
  // instance to resume it
  async retire(): Promise<void> {
    const ws = this.ws;
    // its close handler and messages see it isn't ours anymore
    this.enter({name: 'retired'});
    if (this.outage && this.outage.failoverTimeout) {
      clearTimeout(this.outage.failoverTimeout);
      this.outage.failoverTimeout = null;
    }
    if (!ws) {
      return;
    }
    // closing before the node agreed to keep our players would end them
    if (this.sessionId && !this.resuming && ws.readyState === WebSocket.OPEN) {
      await this.request('PATCH', `/sessions/${this.sessionId}`, {resuming: true, timeout: RESUME_TIMEOUT})
        .catch((error) => log.warn(`voice node ${this.info.name} resuming`, error));
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
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
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
  // by guild, someone's audio the node is sending us (`listen`), we're undeafened while one runs
  listens = new Map<string, GuildListen>();
  // by queue item id (oldest first), told the node's error when it couldn't play that item (until the item ends, we
  // leave or `TRACK_ERROR_LISTEN_FOR`)
  trackErrorListeners = new Map<string, {addedAt: number, guildId: string, listener: (error: string) => void}>();
  // by guild, told when its next track starts or we leave (a skip shows what comes after it)
  nextTrackWaiters = new Map<string, Set<(result: 'left' | 'started') => void>>();
  nodes = new Map<string, NodeConnection>();
  nodesFetchedAt = 0;
  nodesFetching: null | Promise<void> = null;
  readyShards = new Set<number>();
  // players a node kept for us through a restart, rejoined once their shard is ready
  resumedPlayers = new Map<string, {channelId: null | string, effects?: Array<string>, idle?: boolean, node: NodeConnection, paused: boolean, position: number, speed?: number, tempo?: number, volume?: number}>();
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
            const resumed = Array.from(this.resumedPlayers.values()).some((player) => player.node === node);
            if (node.guildIds.length || resumed) {
              // deleted, its last info still says what it was
              node.info = {...node.info, enabled: false};
            } else {
              // its websocket goes too, a new entry for it (added back) would resume the same session
              this.nodes.delete(id);
              node.retire().catch((error) => log.warn(`voice node ${node.info.name} close`, error));
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
          .catch((error) => log.warn(`voice node ${node.info.name} resume`, error));
      }));
      // then the api, for servers that were playing on a node that restarted too
      await this.loadSessions(shard);
    }).catch((error) => log.warn('voice nodes', error)).finally(() => this.resumeDone = true);
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
    log.info(`voice nodes: rejoining ${this.recoveredSessions.size} servers that were playing music before restarting`);
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
        .catch((error) => log.warn(`voice node recover ${guildId}`, error));
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
    // a track that would have ended by now isn't carried on, the queue starts with the next one. One still paused
    // alone carries on once someone listening is in with us
    const resumeAt = (session.finished) ? null : {pause: pauseState(session.paused, !!session.paused_alone), position: session.position};
    const guild = this.join(shard, guildId, channelId, node, {name: 'starting', resumeAt});
    if (!guild) {
      return;
    }
    // they were on before the restart, they go back on with the queue
    guild.effects = session.effects || [];
    guild.tempo = session.tempo ?? 100;
    guild.volume = session.volume ?? 100;
    log.info(`voice node rejoined ${guildId} on ${node.info.name} at ${(session.finished) ? 'the next track' : `${session.position}ms`}`);
  }

  // the restarted shard identified as a new session, so discord dropped us from voice: join again for the nodes'
  // players, they continue where they were held once the new voice state reaches them
  rejoinResumed() {
    for (const [guildId, { channelId, effects, idle, node, paused, position, speed, tempo, volume }] of Array.from(this.resumedPlayers)) {
      const shard = this.shardForGuild(guildId);
      if (!shard || !this.readyShards.has(shard.shardId)) {
        continue;
      }
      this.resumedPlayers.delete(guildId);
      if (!channelId) {
        // disconnected before the restart, still waiting for someone to resume it
        const guild = new GuildVoice(shard, node, {name: 'disconnected'});
        Object.assign(guild, {effects, position: {at: Date.now(), value: position}, speed, tempo, volume});
        this.guilds.set(guildId, guild);
        continue;
      }
      // nothing's playing (24/7 after the queue ran out): the next play has to start the node's queue again, like
      // `queueEnded` left it. Without it we'd think it's playing and the queued track would never start
      const phase: GuildPhase = (idle) ?
        {name: 'idle', leaveTimeout: null} :
        {name: 'playing', aloneTimeout: null, pause: pauseState(paused, false), started: true};
      const existed = this.guilds.has(guildId);
      const guild = this.join(shard, guildId, channelId, node, phase);
      if (!guild || existed) {
        continue;
      }
      Object.assign(guild, {effects, position: {at: Date.now(), value: (idle) ? 0 : position}, speed, tempo, volume});
      if (idle) {
        this.idleUnlessStaying(guildId, guild).catch((error) => log.warn(`voice node idle ${guildId}`, error));
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

  // joins `channelId` for a new guild in `phase`, or for one we're already in (reconnecting after being disconnected),
  // which keeps its phase. Leaves if our voice state and server don't come in time
  // `selfDeaf` false for joining to listen (discord sends a deafened bot no audio)
  private join(shard: ShardClient, guildId: string, channelId: string, node: NodeConnection, phase: GuildPhase, selfDeaf: boolean = true): GuildVoice | null {
    // reloaded, something still running from before (a restore) doesn't join for the old instance
    if (this.detached) {
      return null;
    }
    let guild = this.guilds.get(guildId);
    if (guild) {
      guild.node = node;
      guild.shard = shard;
    } else {
      guild = new GuildVoice(shard, node, phase);
      this.guilds.set(guildId, guild);
    }
    const joined = guild;
    if (joined.joinTimeout) {
      clearTimeout(joined.joinTimeout);
    }
    joined.joinTimeout = setTimeout(() => {
      joined.joinTimeout = null;
      if (this.guilds.get(guildId) === joined) {
        this.leave(guildId);
      }
    }, JOIN_TIMEOUT);
    shard.gateway.voiceStateUpdate(guildId, channelId, {selfDeaf});
    // effects, a volume and a tempo still on (a reconnect after being disconnected, whose session went) are kept for a
    // restart too, without them the session starts with the server's saved ones (`applySavedSound`)
    const effects = (joined.effects && joined.effects.length) ? joined.effects : undefined;
    const volume = (joined.volume !== undefined && joined.volume !== 100) ? joined.volume : undefined;
    const tempo = (joined.tempo !== undefined && joined.tempo !== 100) ? joined.tempo : undefined;
    const speed = (joined.speed && joined.speed !== 1) ? joined.speed : undefined;
    putGuildMusicSession({client: shard}, guildId, {channelId, effects, nodeId: node.id, speed, tempo, volume})
      .then((session) => this.applySavedSound(guildId, joined, session))
      .catch((error) => log.warn(`voice node session ${guildId}`, error));
    return joined;
  }

  // requests to a guild's node player go one after another, in order: a move reads the player's state and sends it to
  // the new node, a pause (or a disconnect, a volume) sent in between went to the old node or was overwritten by what
  // the move read. Each op checks the guild is still there (and in the phase it's for) when it runs, and none awaits
  // another op of the same guild (it would wait for itself)
  private playerOp<T>(guild: GuildVoice, op: () => Promise<T>): Promise<T> {
    const result = guild.ops.then(op);
    guild.ops = result.then(() => {}, () => {});
    return result;
  }

  // the phase's timers go with it
  private setPhase<T extends GuildPhase>(guild: GuildVoice, phase: T): T {
    clearPhaseTimers(guild.phase);
    guild.phase = phase;
    return phase;
  }

  private setRejoin(guild: GuildVoice, rejoin: null | GuildRejoin) {
    if (guild.rejoin && guild.rejoin.timeout) {
      clearTimeout(guild.rejoin.timeout);
    }
    guild.rejoin = rejoin;
  }

  // a rejoin in progress is over (back in voice, disconnected), its tries still count for a while
  private endRejoin(guild: GuildVoice) {
    const rejoin = guild.rejoin;
    if (rejoin && rejoin.stage !== 'done') {
      this.setRejoin(guild, {left: true, since: rejoin.since, stage: 'done', timeout: null, tries: rejoin.tries});
    }
  }

  private clearGuildTimers(guild: GuildVoice) {
    clearPhaseTimers(guild.phase);
    if (guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
      guild.joinTimeout = null;
    }
    if (guild.rejoin && guild.rejoin.timeout) {
      clearTimeout(guild.rejoin.timeout);
      guild.rejoin.timeout = null;
    }
  }

  // the server's saved effects, volume and tempo (the api keeps what was last set until someone changes it, `music
  // effect clear`) for a guild we joined without its own: they go with the voice while still connecting
  // (`forwardVoice`), or to the node's player now
  private applySavedSound(guildId: string, guild: GuildVoice, session: RestResponsesRaw.MusicSession) {
    if (this.guilds.get(guildId) !== guild) {
      return;
    }
    const changes: {effects?: Array<string>, tempo?: number, volume?: number} = {};
    if ((!guild.effects || !guild.effects.length) && session.effects && session.effects.length) {
      changes.effects = guild.effects = session.effects;
    }
    if ((guild.volume === undefined || guild.volume === 100) && session.volume !== undefined && session.volume !== 100) {
      changes.volume = guild.volume = session.volume;
    }
    if ((guild.tempo === undefined || guild.tempo === 100) && session.tempo !== undefined && session.tempo !== 100) {
      changes.tempo = guild.tempo = session.tempo;
    }
    // still connecting sends them with the voice, a disconnected one's player gets them when it's back in
    if (!Object.keys(changes).length || guild.phase.name === 'starting' || guild.phase.name === 'disconnected') {
      return;
    }
    this.updateStoppedPlayer(guildId, guild, changes, 'saved sound');
  }

  // effects, a volume or a tempo for the node's player without a reply waiting on it, the speed it answers with is kept
  private updateStoppedPlayer(guildId: string, guild: GuildVoice, changes: Record<string, unknown>, what: string) {
    this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) !== guild) {
        return;
      }
      const player = await guild.node.updatePlayer(guildId, changes);
      if (player && this.guilds.get(guildId) === guild) {
        this.applyNodeSpeed(guildId, guild, player.speed || 1);
      }
    }).catch((error) => log.warn(`voice node ${guild.node.info.name} ${what} ${guildId}`, error));
  }

  // the node's speed with the effects and the tempo it was given, the api's position goes on at it
  private applyNodeSpeed(guildId: string, guild: GuildVoice, speed: number) {
    if (speed === (guild.speed || 1)) {
      return;
    }
    guild.speed = speed;
    this.editSession(guildId, guild, {speed});
  }

  // keeps the api's music session up to date (only for a restart to carry on from, so nothing waits on it)
  private editSession(guildId: string, guild: GuildVoice, options: Parameters<typeof editGuildMusicSession>[2]) {
    editGuildMusicSession({client: guild.shard}, guildId, options)
      .catch((error) => log.warn(`voice node session ${guildId}`, error));
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
    // when `joined`, resolves once the first track starts (or `JOINED_START_TIMEOUT`). Waited on from before the node
    // is asked, its track start can come in before the request's answer
    started: null | Promise<'left' | 'started' | 'timeout'>,
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
        return {batch, item, joined: false, resumed: null, started: null};
      }
      throw new Error('Music was just reloaded, try again');
    }
    const current = this.guilds.get(guildId);
    if (!current) {
      const started = this.waitForNextTrack(guildId, JOINED_START_TIMEOUT);
      const resumeAt = (resumed) ? {pause: 'none' as const, position: resumed.position} : null;
      this.join(shard, guildId, channelId, node, {name: 'starting', resumeAt});
      return {batch, item, joined: true, resumed, started};
    } else if (current.phase.name === 'idle') {
      // 24/7 with nothing playing (or the queue just ran out), the node's queue starts again (like joining, the reply
      // waits for it)
      const started = this.waitForNextTrack(guildId, JOINED_START_TIMEOUT);
      await this.startIdle(guildId, current);
      return {batch, item, joined: true, resumed: null, started};
    }
    // queued while disconnected, the held track carries on in their channel
    this.reconnect(guildId, channelId);
    return {batch, item, joined: false, resumed: null, started: null};
  }

  // `listener` gets the node's error if the queue item fails (converting it, or while it plays), once
  onTrackError(guildId: string, queueItemId: string, listener: (error: string) => void) {
    const now = Date.now();
    // oldest first, the expired ones are at the front
    for (const [id, waiter] of this.trackErrorListeners) {
      if (now - waiter.addedAt < TRACK_ERROR_LISTEN_FOR) {
        break;
      }
      this.trackErrorListeners.delete(id);
    }
    // to the back, the order stays oldest first
    this.trackErrorListeners.delete(queueItemId);
    this.trackErrorListeners.set(queueItemId, {addedAt: now, guildId, listener});
  }

  // false while joining, while disconnected (`reconnect` carries on from there) and while 24/7 keeps us in voice with
  // nothing playing
  isPlaying(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && guild.phase.name === 'playing';
  }

  // 24/7 got turned off: an idle guild leaves after `IDLE_LEAVE_DELAY`, a playing one that long after its queue runs out
  unstay(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (guild && guild.phase.name === 'idle' && !guild.phase.leaveTimeout) {
      this.leaveWhenIdle(guildId, guild);
    }
  }

  // an idle guild (24/7, or waiting to leave) plays its queue again. If the node never starts it (the request failed
  // and no track started meanwhile) it's idle again, leaving unless 24/7, instead of in voice with nothing on for good
  private async startIdle(guildId: string, guild: GuildVoice) {
    const idle: GuildPhase = guild.phase;
    if (idle.name !== 'idle') {
      return;
    }
    const playing: GuildPhase & {name: 'playing'} = {name: 'playing', aloneTimeout: null, pause: 'none', started: false};
    this.setPhase(guild, playing);
    guild.position = {at: Date.now(), value: 0};
    try {
      await this.playerOp(guild, async () => {
        // left, or disconnected meanwhile (its own op holds the player)
        if (this.guilds.get(guildId) === guild && guild.phase === playing) {
          await guild.node.updatePlayer(guildId, {paused: false, queue: true});
        }
      });
    } catch(error) {
      if (this.guilds.get(guildId) === guild && guild.phase === playing && !playing.started) {
        this.setPhase(guild, {name: 'idle', leaveTimeout: null});
        this.idleUnlessStaying(guildId, guild).catch((error) => log.warn(`voice node idle ${guildId}`, error));
      }
      throw error;
    }
  }

  // the queue ran out (`QUEUE_END` already made the guild idle, `phase`): we stay in the channel idle until the next
  // play, for good on 24/7 servers and for `IDLE_LEAVE_DELAY` on the rest. The api says which, from the server's setting
  // and premium
  private async queueEnded(guildId: string, guild: GuildVoice, phase: GuildPhase) {
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    // we left, or a play started the queue again while the api answered (another end is its own)
    if (this.guilds.get(guildId) !== guild || guild.phase !== phase) {
      return;
    }
    if (!music) {
      return this.leave(guildId);
    }
    this.editSession(guildId, guild, {paused: false, position: 0});
    if (!music.premium || !music.stay) {
      this.leaveWhenIdle(guildId, guild);
    }
  }

  // idle without knowing the server's 24/7 (rejoined after a restart, a failed start): the api says whether we wait to leave
  private async idleUnlessStaying(guildId: string, guild: GuildVoice) {
    const phase = guild.phase;
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    if (this.guilds.get(guildId) === guild && guild.phase === phase && phase.name === 'idle' && !phase.leaveTimeout && (!music || !music.premium || !music.stay)) {
      this.leaveWhenIdle(guildId, guild);
    }
  }

  private leaveWhenIdle(guildId: string, guild: GuildVoice) {
    const phase = guild.phase;
    if (phase.name !== 'idle') {
      return;
    }
    if (phase.leaveTimeout) {
      clearTimeout(phase.leaveTimeout);
    }
    phase.leaveTimeout = setTimeout(() => {
      phase.leaveTimeout = null;
      this.idleTimedOut(guildId, guild, phase).catch((error) => {
        log.warn(`voice node idle leave ${guildId}`, error);
        if (this.guilds.get(guildId) === guild && guild.phase === phase) {
          this.leave(guildId);
        }
      });
    }, IDLE_LEAVE_DELAY);
  }

  // still idle after `IDLE_LEAVE_DELAY`: we leave, unless 24/7 got turned on in the meantime
  private async idleTimedOut(guildId: string, guild: GuildVoice, phase: GuildPhase & {name: 'idle'}) {
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    // played meanwhile, or another wait started (24/7 turned off again)
    if (this.guilds.get(guildId) !== guild || guild.phase !== phase || phase.leaveTimeout) {
      return;
    }
    if (!music || !music.premium || !music.stay) {
      // joined only to listen, it's still going: we wait again once it's over (`endListen`)
      if (this.listens.has(guildId)) {
        return;
      }
      this.leave(guildId);
    }
  }

  isDisconnected(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && guild.phase.name === 'disconnected';
  }

  // joined to play the queue and still connecting to voice, nothing's on the node yet
  isStarting(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && guild.phase.name === 'starting';
  }

  // a resume while still connecting (`isStarting`): a restart's rejoin of a paused track carries on unpaused once it's
  // in. Where it starts from, null when it isn't connecting anymore
  resumeStarting(guildId: string): null | number {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'starting') {
      return null;
    }
    if (guild.phase.resumeAt) {
      guild.phase.resumeAt.pause = 'none';
      return guild.phase.resumeAt.position;
    }
    return 0;
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
    this.join(shard, guildId, channelId, node, {name: 'starting', resumeAt: {pause: 'none', position: music.held_position}});
    return {item: music.current, position: music.held_position};
  }

  // joins `channelId` after we were disconnected, the node's held track carries on unpaused once our voice state
  // reaches it (`forwardVoice`)
  reconnect(guildId: string, channelId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'disconnected' || this.detached) {
      return false;
    }
    this.join(guild.shard, guildId, channelId, guild.node, guild.phase);
    return true;
  }

  // someone other than a bot in `channelId`, a channel that isn't cached counts as listened to. `hearing` (`pause_alone`)
  // also leaves out anyone deafened, by themselves or the server
  private hasListeners(shard: ShardClient, channelId: string, hearing: boolean = false): boolean {
    const channel = shard.channels.get(channelId);
    if (!channel || !(channel.isGuildVoice || channel.isGuildStageVoice)) {
      return !channel;
    }
    return channel.voiceStates.some((state) => {
      if (state.userId === shard.userId || (hearing && (state.deaf || state.selfDeaf))) {
        return false;
      }
      // voice states from GUILD_CREATE come without their member, the caches tell if they're a bot
      const member = state.member || shard.members.get(channel.guildId, state.userId);
      const user = (member) ? member.user : shard.users.get(state.userId);
      return !(user && user.bot);
    });
  }

  // someone joined, left, deafened or undeafened in a guild we're playing in (or we were moved): with `pause_alone` the
  // track pauses once nobody else in our channel can hear it, and carries on when someone can again
  handleListeners(guildId: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.channelId || this.detached) {
      return;
    }
    const phase = guild.phase;
    if (phase.name !== 'playing') {
      return;
    }
    if (this.hasListeners(guild.shard, guild.channelId, true)) {
      if (phase.aloneTimeout) {
        clearTimeout(phase.aloneTimeout);
        phase.aloneTimeout = null;
      }
      if (phase.pause === 'alone') {
        this.setPaused(guildId, false).catch((error) => log.warn(`voice node resuming ${guildId} for a listener`, error));
      }
      return;
    }
    if (phase.aloneTimeout || phase.pause !== 'none') {
      return;
    }
    phase.aloneTimeout = setTimeout(() => {
      phase.aloneTimeout = null;
      this.pauseAlone(guildId, guild).catch((error) => log.warn(`voice node pausing ${guildId} alone`, error));
    }, ALONE_PAUSE_DELAY);
  }

  // still nobody listening after `ALONE_PAUSE_DELAY`, it pauses if the server has `pause_alone` (on for everyone, only
  // premium servers can turn it off, the api says). Without 24/7 the node's pause timeout then leaves with it held
  private async pauseAlone(guildId: string, guild: GuildVoice) {
    const stillAlone = () => {
      return this.guilds.get(guildId) === guild && guild.phase.name === 'playing' && guild.phase.pause === 'none' &&
        !!guild.channelId && !this.hasListeners(guild.shard, guild.channelId, true);
    };
    if (!stillAlone()) {
      return;
    }
    const music = await fetchGuildMusic({client: guild.shard}, guildId).catch(() => null);
    if (!music || !music.pause_alone || !stillAlone()) {
      return;
    }
    await this.setPaused(guildId, true, true);
  }

  // pausing keeps the voice connection and the track's position, null when nothing's playing in the guild. `alone` is
  // `pause_alone`'s, a listener coming back undoes it (anyone else's pause or resume stays)
  async setPaused(guildId: string, paused: boolean, alone: boolean = false): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return null;
    }
    const phase = guild.phase;
    const before = phase.pause;
    const pause = pauseState(paused, alone);
    // right away: a listener coming back before the node answers resumes it (its resume goes after this)
    phase.pause = pause;
    try {
      return await this.playerOp(guild, async () => {
        if (this.guilds.get(guildId) !== guild || guild.phase !== phase) {
          return null;
        }
        const player = await guild.node.updatePlayer(guildId, {paused});
        if (player) {
          guild.position = {at: Date.now(), value: player.position || 0};
        }
        this.editSession(guildId, guild, {paused, pausedAlone: pause === 'alone', position: (guild.position) ? guild.position.value : undefined});
        return (player && player.track) ? player : null;
      });
    } catch(error) {
      // what the node still has, unless something told it otherwise since
      if (phase.pause === pause) {
        phase.pause = before;
      }
      throw error;
    }
  }

  // `pause_alone` paused it, nobody else in the channel can hear it (the dashboard can't resume it)
  isPausedAlone(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    return !!guild && guild.phase.name === 'playing' && guild.phase.pause === 'alone';
  }

  // `position` in milliseconds, past the end ends the track (and the queue goes on), null when nothing's playing
  async seek(guildId: string, position: number): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return null;
    }
    return this.playerOp(guild, () => this.seekPlayer(guildId, guild, position, 'playing'));
  }

  // inside an op: a seek (or a replay while held) of a guild still in `phase`
  private async seekPlayer(guildId: string, guild: GuildVoice, position: number, phase: 'disconnected' | 'playing'): Promise<NodePlayer | null> {
    if (this.guilds.get(guildId) !== guild || guild.phase.name !== phase) {
      return null;
    }
    const player = await guild.node.updatePlayer(guildId, {position});
    guild.position = {at: Date.now(), value: position};
    this.editSession(guildId, guild, {position});
    return (player && player.track) ? player : null;
  }

  // the node's stacked live effects (`MusicEffects`, none turns them off, the formatter sorts out what stacks), they stay
  // on across tracks and leaving until changed (the api saves them for the server). null when nothing's playing
  async setEffects(guildId: string, effects: Array<string>): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return null;
    }
    return this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) !== guild || guild.phase.name !== 'playing') {
        return null;
      }
      const player = await guild.node.updatePlayer(guildId, {effects});
      guild.effects = effects;
      guild.speed = (player && player.speed) || 1;
      if (player) {
        guild.position = {at: Date.now(), value: player.position || 0};
      }
      // a restart puts them back on (`recoverGuild`), the api's position goes on at the new speed
      this.editSession(guildId, guild, {effects, position: (player) ? guild.position!.value : undefined, speed: guild.speed});
      return (player && player.track) ? player : null;
    });
  }

  // the node's tempo (percent, `MIN_MUSIC_SPEED` to `MAX_MUSIC_SPEED`, the pitch kept, 100 is the file as it is), it
  // stays across tracks and leaving like the effects. null when nothing's playing
  async setTempo(guildId: string, tempo: number): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return null;
    }
    return this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) !== guild || guild.phase.name !== 'playing') {
        return null;
      }
      const player = await guild.node.updatePlayer(guildId, {tempo});
      guild.tempo = tempo;
      guild.speed = (player && player.speed) || 1;
      if (player) {
        guild.position = {at: Date.now(), value: player.position || 0};
      }
      // a restart puts it back (`recoverGuild`), the api's position goes on at the new speed
      this.editSession(guildId, guild, {position: (player) ? guild.position!.value : undefined, speed: guild.speed, tempo});
      return (player && player.track) ? player : null;
    });
  }

  // the node's volume (percent, 0 to 200, 100 is the file as it is), it stays across tracks and leaving like the
  // effects. null when nothing's playing
  async setVolume(guildId: string, volume: number): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return null;
    }
    return this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) !== guild || guild.phase.name !== 'playing') {
        return null;
      }
      const player = await guild.node.updatePlayer(guildId, {volume});
      guild.volume = volume;
      // a restart puts it back (`recoverGuild`)
      this.editSession(guildId, guild, {volume});
      return (player && player.track) ? player : null;
    });
  }

  // the server's saved effects, volume or tempo changed while we're in voice but not playing (24/7 with nothing on,
  // disconnected, still joining): what the queue starts with next. The api has them already (`editGuildMusicSound`)
  setStoppedSound(guildId: string, changes: {effects?: Array<string>, tempo?: number, volume?: number}) {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name === 'playing') {
      return;
    }
    if (changes.effects) {
      guild.effects = changes.effects;
    }
    if (changes.tempo !== undefined) {
      guild.tempo = changes.tempo;
    }
    if (changes.volume !== undefined) {
      guild.volume = changes.volume;
    }
    // still connecting sends them with the voice
    if (guild.phase.name === 'starting') {
      return;
    }
    this.updateStoppedPlayer(guildId, guild, changes, 'sound');
  }

  // what's playing back to the start, playing or paused as it was. Disconnected, it stays held paused at the start for
  // `reconnect`. null when nothing's playing (joining, 24/7 with nothing on)
  async replay(guildId: string): Promise<NodePlayer | null> {
    const guild = this.guilds.get(guildId);
    if (!guild || (guild.phase.name !== 'playing' && guild.phase.name !== 'disconnected')) {
      return null;
    }
    return this.playerOp(guild, () => {
      const phase = guild.phase.name;
      return (phase === 'playing' || phase === 'disconnected') ? this.seekPlayer(guildId, guild, 0, phase) : Promise.resolve(null);
    });
  }

  // ends the track, the node goes on with the next queued item (or the queue ends and we leave). The node keeps
  // `paused` across tracks, so it's unpaused too, unless `pause_alone` paused it (nobody's there to hear the next one).
  // `itemId` is the queue item we said was skipped (`musicSkipTarget`): near a track's end the api has the next one
  // playing already, between tracks one's converting, the node skips that one then. A skip that reaches the node after
  // its track ended on its own is dropped instead of skipping the next one too
  async skip(guildId: string, itemId?: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.phase.name !== 'playing') {
      return false;
    }
    return this.playerOp(guild, async () => {
      const phase = guild.phase;
      if (this.guilds.get(guildId) !== guild || phase.name !== 'playing') {
        return false;
      }
      const paused = phase.pause === 'alone';
      await guild.node.updatePlayer(guildId, {paused, skip: true, ...(itemId) ? {skipItemId: itemId} : {}});
      if (guild.phase === phase) {
        phase.pause = pauseState(paused, true);
      }
      this.editSession(guildId, guild, {paused, pausedAlone: paused});
      return true;
    });
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
      deleteGuildMusic({client: guild.shard}, guildId).catch((error) => log.warn('voice node clear queue', error));
    } else {
      deleteGuildMusicSession({client: guild.shard}, guildId).catch((error) => log.warn('voice node session', error));
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
    const idle = guild.phase.name === 'idle';
    const paused = guild.paused;
    // still paused alone, someone listening once we're back carries on
    const pausedAlone = guild.alonePaused;
    const position = (idle) ? 0 : this.estimatePosition(guild, downAt);
    this.drop(guildId);
    this.emit(VoiceNodeEvents.LEFT, {guildId});
    if (guild.phase.name === 'disconnected') {
      return;
    }
    const shard = guild.shard;
    if (!channelId) {
      deleteGuildMusicSession({client: shard}, guildId).catch((error) => log.warn('voice node session', error));
      return;
    }
    fetchGuildMusic({client: shard}, guildId).catch(() => null).then((music) => {
      // someone played something in the meantime, its join made a new session
      if (this.detached || this.guilds.has(guildId)) {
        return;
      }
      if (!music || !music.premium || !music.stay) {
        deleteGuildMusicSession({client: shard}, guildId).catch((error) => log.warn('voice node session', error));
        return;
      }
      editGuildMusicSession({client: shard}, guildId, {nodeId: null, paused, pausedAlone, position})
        .catch((error) => log.warn(`voice node session ${guildId}`, error));
      const effects = guild.effects || [];
      const tempo = guild.tempo ?? 100;
      const volume = guild.volume ?? 100;
      this.recoveredSessions.set(guildId, {
        loadedAt: Date.now(),
        // 24/7 with nothing playing has no track to carry on, the queue starts again
        session: {channel_id: channelId, effects, finished: idle, guild_id: guildId, held: false, node_id: null, paused, paused_alone: pausedAlone, position, speed: guild.speed || 1, stay: true, tempo, volume},
      });
      log.info(`voice node ${guild.node.info.name} lost ${guildId} (24/7), rejoining at ${position}ms once a node can be reached`);
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
      const played = (guild.paused) ? 0 : Date.now() - guild.position.at;
      position = guild.position.value + Math.round(played * (guild.speed || 1));
    }
    this.drop(guildId);
    // the effects, the volume and the tempo stay the server's saved ones (the api's), the next join puts them back on
    putGuildMusicSession({client: guild.shard}, guildId, {channelId, held: true, nodeId: null, paused: true, position, speed: 1})
      .catch((error) => log.warn(`voice node hold ${guildId}`, error));
    log.info(`voice node held ${guildId} at ${position}ms`);
    this.emit(VoiceNodeEvents.LEFT, {guildId});
  }

  // leaves the channel and ends the node's player, what happens to the api's queue and session is up to the caller.
  // Not an op (it'd wait behind a hung request, and a play right after would make a player for it to destroy): ops
  // still queued find the guild gone, a move that was making a player on its new node destroys it after
  private drop(guildId: string): GuildVoice | null {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return null;
    }
    this.guilds.delete(guildId);
    this.resolveNextTrack(guildId, 'left');
    // out of `guilds` first, ending it doesn't deafen us again in a channel we're leaving
    this.endListen(guildId, 'left');
    this.clearGuildTimers(guild);
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
    const rejoin = (guild.rejoin && guild.rejoin.stage !== 'done') ? guild.rejoin : null;
    if (!channelId) {
      if (rejoin && (!rejoin.left || rejoin.stage === 'leaving')) {
        // our own leave to rejoin, the join's voice state and server come next
        rejoin.left = true;
        return;
      }
      // still joining, nothing's on the node to hold
      if (guild.phase.name === 'starting') {
        return this.leave(guildId, true);
      }
      return this.disconnect(guildId, guild);
    }
    if (rejoin) {
      // from before our leave, the join's comes after it
      if (rejoin.stage === 'leaving') {
        return;
      }
      // the join's, without a channel from here on is someone disconnecting us
      rejoin.left = true;
    }
    if (guild.channelId && guild.channelId !== channelId && guild.phase.name !== 'disconnected') {
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
    const phase = guild.phase;
    if (phase.name === 'disconnected') {
      return;
    }
    // 24/7 with nothing playing has nothing to hold, it stays out until the next play
    if (phase.name === 'idle') {
      return this.leave(guildId);
    }
    if (guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
      guild.joinTimeout = null;
    }
    this.endRejoin(guild);
    // where it got to before it's paused, the node's answer is exact and replaces it
    const position = this.estimatePosition(guild, Date.now());
    const disconnected = this.setPhase(guild, {name: 'disconnected'});
    guild.endpoint = guild.sessionId = guild.token = undefined;
    guild.position = {at: Date.now(), value: position};
    const channelId = guild.channelId;
    const held = (channelId) ?
      putGuildMusicSession({client: guild.shard}, guildId, {channelId, held: true, nodeId: null, paused: true, position, speed: 1}) :
      deleteGuildMusicSession({client: guild.shard}, guildId);
    held.catch((error) => log.warn(`voice node hold ${guildId}`, error));
    this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) !== guild) {
        return;
      }
      const player = await guild.node.updatePlayer(guildId, {paused: true, voice: null});
      if (player) {
        guild.position = {at: Date.now(), value: player.position || 0};
        // after the hold's saved, a patch before it would find no session
        await held.catch(() => {});
        if (this.guilds.get(guildId) === guild && guild.phase === disconnected) {
          this.editSession(guildId, guild, {position: guild.position.value});
        }
      }
    }).catch((error) => log.warn(`voice node ${guild.node.info.name} pausing ${guildId}`, error));
  }

  // from VOICE_SERVER_UPDATE, a null endpoint means discord is moving us to another voice server (another update follows)
  handleVoiceServer(guildId: string, endpoint: null | string, token: string) {
    const guild = this.guilds.get(guildId);
    if (!guild || !endpoint) {
      return;
    }
    // from before our leave to rejoin, the join's comes after it
    if (guild.rejoin && guild.rejoin.stage === 'leaving') {
      return;
    }
    guild.endpoint = endpoint;
    guild.token = token;
    this.forwardVoice(guildId, guild);
  }

  // our complete voice to the node: starting starts the queue with it, disconnected carries the held track on
  private forwardVoice(guildId: string, guild: GuildVoice) {
    const { channelId, endpoint, sessionId, token } = guild;
    if (!channelId || !endpoint || !sessionId || !token) {
      return;
    }
    const body: Record<string, unknown> = {voice: {channelId, endpoint, sessionId, token}};
    const phase = guild.phase;
    if (phase.name === 'starting') {
      body.paused = false;
      body.queue = true;
      // a restart's recovered effects, volume and tempo (a new player has none, at 100)
      if (guild.effects && guild.effects.length) {
        body.effects = guild.effects;
      }
      if (guild.volume !== undefined && guild.volume !== 100) {
        body.volume = guild.volume;
      }
      if (guild.tempo !== undefined && guild.tempo !== 100) {
        body.tempo = guild.tempo;
      }
      const resumeAt = phase.resumeAt;
      this.setPhase(guild, {name: 'playing', aloneTimeout: null, pause: (resumeAt) ? resumeAt.pause : 'none', started: false});
      if (resumeAt) {
        // rejoined after a restart, the playing track carries on
        body.paused = resumeAt.pause !== 'none';
        body.position = resumeAt.position;
        body.queueCurrent = true;
        guild.position = {at: Date.now(), value: resumeAt.position};
        guild.movedAt = Date.now();
        // a held one was left paused in the session
        this.editSession(guildId, guild, {paused: resumeAt.pause !== 'none', pausedAlone: resumeAt.pause === 'alone', position: resumeAt.position});
      }
    } else if (phase.name === 'disconnected') {
      // joined again after being disconnected, the held track carries on
      body.paused = false;
      this.setPhase(guild, {name: 'playing', aloneTimeout: null, pause: 'none', started: true});
      this.editSession(guildId, guild, {paused: false, position: (guild.position) ? guild.position.value : undefined});
    }
    if (guild.joinTimeout) {
      clearTimeout(guild.joinTimeout);
      guild.joinTimeout = null;
    }
    if (guild.rejoin && guild.rejoin.stage === 'awaitingVoice') {
      this.endRejoin(guild);
    }
    this.playerOp(guild, async () => {
      // to the node it's on by now (a move before this went first)
      if (this.guilds.get(guildId) !== guild) {
        return null;
      }
      return guild.node.updatePlayer(guildId, body);
    }).then((player) => {
      // the recovered (or saved) effects and tempo play it at this
      if (player && this.guilds.get(guildId) === guild) {
        this.applyNodeSpeed(guildId, guild, player.speed || 1);
      }
    }, (error) => {
      log.warn(`voice node ${guild.node.info.name}`, error);
      if (this.guilds.get(guildId) === guild) {
        this.leave(guildId);
      }
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
        if (event.data.error || guild.phase.name === 'disconnected') {
          this.leave(guildId);
        } else {
          // idle right away, not once the api answers: the node stopped asking for tracks, so a `music play` in
          // between has to start its queue again (`startIdle`), `reconnect` would leave it queued with nothing playing
          const idle = this.setPhase(guild, {name: 'idle', leaveTimeout: null});
          guild.position = {at: Date.now(), value: 0};
          // nothing comes next (a skip of the last track waits for this)
          this.resolveNextTrack(guildId, 'left');
          this.queueEnded(guildId, guild, idle).catch((error) => {
            log.warn(`voice node queue end ${guildId}`, error);
            if (this.guilds.get(guildId) === guild) {
              this.leave(guildId);
            }
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
        const phase = guild.phase;
        if (phase.name === 'idle') {
          this.setPhase(guild, {name: 'playing', aloneTimeout: null, pause: 'none', started: true});
        } else if (phase.name === 'playing') {
          phase.started = true;
        }
        if (!guild.movedAt || PLAYER_UPDATE_INTERVAL * 2 < Date.now() - guild.movedAt) {
          guild.position = {at: Date.now(), value: 0};
        }
        this.resolveNextTrack(guildId, 'started');
        this.refreshNodes(guild.shard).then(() => {
          if (!node.info.enabled) {
            return this.moveGuild(guildId, 'drain');
          }
        }).catch((error) => log.warn(`voice node move ${guildId}`, error));
      }; break;
      // the node's voice connection is gone for good while we're still in the channel (a dropped session like after a
      // failover, failed reconnects, a close discord sent no new voice server after), new credentials only come from
      // leaving and joining again
      case 'VOICE_LOST': {
        this.rejoin(guildId, event.data.error);
      }; break;
      case 'LISTEN_AUDIO': {
        const listen = this.listens.get(guildId);
        if (listen && !listen.stopping && listen.userId === event.data.userId && typeof(event.data.audio) === 'string') {
          listen.onAudio(Buffer.from(event.data.audio, 'base64'), event.data.heard);
        }
      }; break;
      case 'LISTEN_END': {
        const listen = this.listens.get(guildId);
        if (listen && listen.userId === event.data.userId) {
          this.endListen(guildId, event.data.reason as ListenEndReason);
        }
      }; break;
    }
  }

  isListening(guildId: string): boolean {
    return this.listens.has(guildId);
  }

  // has the node send us `userId`'s audio in `channelId` (everyone's mixed for null) for up to `duration` milliseconds
  // (`handlers`), until `stopListening`. We're undeafened while it runs. Playing in that channel already it goes
  // alongside the music, otherwise we join idle for it (leaving like an idle guild once it's over, unless something gets
  // played)
  async listen(
    shard: ShardClient,
    guildId: string,
    channelId: string,
    userId: null | string,
    duration: number,
    handlers: ListenHandlers,
  ): Promise<void> {
    if (this.detached) {
      throw new Error('Music was just reloaded, try again');
    }
    if (this.listens.has(guildId)) {
      throw new VoiceListenError('busy');
    }
    let guild = this.guilds.get(guildId);
    if (guild && (guild.phase.name === 'disconnected' || guild.channelId !== channelId)) {
      throw new VoiceListenError('elsewhere', guild.channelId || null);
    }
    const listen: GuildListen = {...handlers, stopping: false, timeout: null, userId};
    // taken before anything's awaited, a second listen in the meantime is busy
    this.listens.set(guildId, listen);
    try {
      if (guild) {
        shard.gateway.voiceStateUpdate(guildId, channelId, {selfDeaf: false});
      } else {
        const node = await this.pickNode(shard);
        // left or joined by something else while picking
        if (this.listens.get(guildId) !== listen || this.guilds.has(guildId) || this.detached) {
          throw new Error('Music changed while joining, try again');
        }
        const joined = this.join(shard, guildId, channelId, node, {name: 'idle', leaveTimeout: null}, false);
        if (!joined) {
          throw new Error('Music was just reloaded, try again');
        }
        guild = joined;
        this.idleUnlessStaying(guildId, joined).catch((error) => log.warn(`voice node idle ${guildId}`, error));
      }
      const listening = guild;
      listen.timeout = setTimeout(() => this.giveUpListen(guildId, listen), duration + LISTEN_END_GRACE);
      // before our voice reaches a new player the node holds it, it starts once the voice connection's up
      await this.playerOp(listening, async () => {
        if (this.guilds.get(guildId) === listening && this.listens.get(guildId) === listen) {
          await listening.node.updatePlayer(guildId, {listen: (userId) ? {duration, userId} : {duration, everyone: true}});
        }
      });
    } catch(error) {
      if (this.listens.get(guildId) === listen) {
        this.endListen(guildId, 'timeout', false);
      }
      throw error;
    }
  }

  // asks the node to stop (a song was found, or they pressed stop), its `LISTEN_END` ends it here
  stopListening(guildId: string) {
    const listen = this.listens.get(guildId);
    const guild = this.guilds.get(guildId);
    if (!listen || listen.stopping) {
      return;
    }
    listen.stopping = true;
    if (listen.timeout) {
      clearTimeout(listen.timeout);
    }
    listen.timeout = setTimeout(() => this.giveUpListen(guildId, listen), LISTEN_STOP_WAIT);
    if (!guild) {
      return this.endListen(guildId, 'left');
    }
    this.playerOp(guild, async () => {
      if (this.guilds.get(guildId) === guild) {
        await guild.node.updatePlayer(guildId, {listen: null});
      }
    }).catch((error) => {
      log.warn(`voice node ${guild.node.info.name} stop listening ${guildId}`, error);
      this.giveUpListen(guildId, listen);
    });
  }

  // the node never ended it (or couldn't be asked to stop): it's over here, and we tell the node in case it's still going
  private giveUpListen(guildId: string, listen: GuildListen) {
    if (this.listens.get(guildId) !== listen) {
      return;
    }
    const guild = this.guilds.get(guildId);
    if (guild && !listen.stopping) {
      guild.node.updatePlayer(guildId, {listen: null}).catch(() => {});
    }
    this.endListen(guildId, (listen.stopping) ? 'stopped' : 'timeout');
  }

  // the listen's over: we deafen ourselves again (still in the channel), a guild we joined only for it starts waiting
  // to leave again, and its command hears why it ended
  private endListen(guildId: string, reason: ListenEndReason, notify: boolean = true) {
    const listen = this.listens.get(guildId);
    if (!listen) {
      return;
    }
    this.listens.delete(guildId);
    if (listen.timeout) {
      clearTimeout(listen.timeout);
      listen.timeout = null;
    }
    const guild = this.guilds.get(guildId);
    if (guild && guild.channelId && guild.phase.name !== 'disconnected') {
      guild.shard.gateway.voiceStateUpdate(guildId, guild.channelId, {selfDeaf: true});
    }
    if (guild && guild.phase.name === 'idle' && !guild.phase.leaveTimeout) {
      this.idleUnlessStaying(guildId, guild).catch((error) => log.warn(`voice node idle ${guildId}`, error));
    }
    if (notify) {
      try {
        listen.onEnd(reason);
      } catch(error) {
        log.warn(`voice node listen end ${guildId}`, error);
      }
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
    // already rejoining, its own voice comes
    if (!guild || !guild.channelId || guild.phase.name === 'disconnected' || (guild.rejoin && guild.rejoin.stage !== 'done')) {
      return;
    }
    const now = Date.now();
    const last = guild.rejoin;
    const tries = (last && now - last.since < REJOIN_RETRY_WINDOW) ? last.tries + 1 : 1;
    if (REJOIN_MAX_TRIES < tries) {
      log.warn(`voice connection for ${guildId} keeps getting lost (${error || 'no error'}), leaving`);
      return (guild.phase.name === 'idle') ? this.leave(guildId) : this.hold(guildId);
    }
    const channelId = guild.channelId;
    log.warn(`voice connection for ${guildId} was lost (${error || 'no error'}), rejoining`);
    // the old ones are dead, and discord doesn't order the join's voice server before or after its voice state: one of
    // them with what's left of the old would go to the node
    guild.endpoint = guild.sessionId = guild.token = undefined;
    this.setRejoin(guild, {left: false, since: now, stage: 'leaving', timeout: null, tries});
    this.rejoinLater(guildId, guild, channelId);
    guild.shard.gateway.voiceStateUpdate(guildId, null);
  }

  // the join half of a rejoin, `REJOIN_DELAY` after leaving
  private rejoinLater(guildId: string, guild: GuildVoice, channelId: string) {
    const rejoin = guild.rejoin;
    if (!rejoin || rejoin.stage !== 'leaving') {
      return;
    }
    rejoin.timeout = setTimeout(() => {
      rejoin.timeout = null;
      if (this.guilds.get(guildId) !== guild || guild.rejoin !== rejoin) {
        return;
      }
      rejoin.stage = 'awaitingVoice';
      this.awaitRejoinVoice(guildId, guild);
      guild.shard.gateway.voiceStateUpdate(guildId, channelId, {selfDeaf: true});
    }, REJOIN_DELAY);
  }

  // like any join, voice that doesn't come back leaves (the track held for the next play)
  private awaitRejoinVoice(guildId: string, guild: GuildVoice) {
    const rejoin = guild.rejoin;
    if (!rejoin || rejoin.stage !== 'awaitingVoice') {
      return;
    }
    rejoin.timeout = setTimeout(() => {
      rejoin.timeout = null;
      if (this.guilds.get(guildId) !== guild || guild.rejoin !== rejoin || rejoin.stage !== 'awaitingVoice') {
        return;
      }
      log.warn(`voice connection for ${guildId} didn't come back after rejoining, leaving`);
      return (guild.phase.name === 'idle') ? this.leave(guildId) : this.hold(guildId);
    }, JOIN_TIMEOUT);
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
    log.warn(`voice node ${node.info.name} ${(reason === 'down') ? 'is down' : 'restarted'}, moving ${guildIds.length} servers`);
    for (let i = 0; i < guildIds.length; i += FAILOVER_BATCH) {
      await Promise.all(guildIds.slice(i, i + FAILOVER_BATCH).map((guildId) => {
        return this.moveGuild(guildId, reason, downAt).catch((error) => log.warn(`voice node failover ${guildId}`, error));
      }));
    }
  }

  /**
   * Moves a guild's player to the enabled node with the fewest guilds, like lavalink clients moving players between
   * nodes: the new node gets the same voice state (we stay in the channel, discord drops the old node's voice connection)
   * and takes the queue's playing item over from where it was (`queueCurrent`). Draining asks the old player where it is
   * and destroys it, a node that's down or restarted can't be asked, so it's the last known position. A guild stays put
   * when no other node can take it (a node that's down keeps being reconnected to until it gives up). An op: a pause, a
   * volume or a disconnect while it moves goes to the new node after it
   */
  async moveGuild(guildId: string, reason: MoveReason, downAt: number = Date.now()): Promise<void> {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.moving) {
      return;
    }
    guild.moving = true;
    try {
      await this.playerOp(guild, () => this.movePlayer(guildId, guild, reason, downAt));
    } finally {
      guild.moving = false;
    }
  }

  private async movePlayer(guildId: string, guild: GuildVoice, reason: MoveReason, downAt: number) {
    if (this.guilds.get(guildId) !== guild) {
      return;
    }
    const from = guild.node;
    // a node that's down isn't picked again, a restarted one can take its own guilds back
    const exclude = (reason === 'down') ? from : undefined;

    // still joining, nothing's on the node yet: the voice goes to the new one when it comes (an op after this one, even
    // if it came while picking)
    if (guild.phase.name === 'starting') {
      if (reason !== 'drain') {
        const to = await this.pickNode(guild.shard, exclude).catch(() => null);
        if (to && this.guilds.get(guildId) === guild && guild.node === from) {
          guild.node = to;
        }
      }
      return;
    }

    const to = await this.pickNode(guild.shard, exclude).catch(() => null);
    if (!to || this.guilds.get(guildId) !== guild || guild.node !== from || (reason === 'drain' && to === from)) {
      return;
    }

    let position: number;
    if (reason === 'drain') {
      const player = await from.getPlayer(guildId);
      position = (player) ? player.position || 0 : 0;
    } else {
      position = this.estimatePosition(guild, downAt);
    }
    if (this.guilds.get(guildId) !== guild) {
      return;
    }

    // events from here on are the old player ending, ignored
    guild.node = to;
    if (reason === 'drain') {
      await from.destroyPlayer(guildId).catch((error) => log.warn(`voice node ${from.info.name} destroy`, error));
    }
    if (this.guilds.get(guildId) !== guild) {
      return;
    }
    // what it is now (a pause, a disconnect or a rejoin can have come in while picking), anything newer is an op after
    // this. Without voice the new node holds the track until a voice comes: a disconnected one's `reconnect`, or the
    // voice a rejoin (or a rejoin after a restart) is still waiting for, whose own op goes to the new node
    const voice = this.voiceOf(guild);
    const paused = guild.paused;
    try {
      await to.updatePlayer(guildId, {...(voice) ? {voice} : {}, effects: guild.effects || [], paused, position, queue: true, queueCurrent: true, tempo: guild.tempo ?? 100, volume: guild.volume ?? 100});
    } catch(error) {
      // nothing's playing it anymore, leave like a node that fails on join (the queue stays)
      log.warn(`voice node ${to.info.name} taking over ${guildId}`, error);
      if (this.guilds.get(guildId) === guild) {
        this.leave(guildId);
      }
      return;
    }
    if (this.guilds.get(guildId) !== guild) {
      // left while it was asked, the leave's destroy could have come first. Unless a new play is on it already
      const now = this.guilds.get(guildId);
      if (!now || now.node !== to) {
        to.destroyPlayer(guildId).catch(() => {});
      }
      return;
    }
    guild.movedAt = Date.now();
    guild.position = {at: Date.now(), value: position};
    if (voice) {
      this.editSession(guildId, guild, {nodeId: to.id, paused, position});
    }
    log.info(`voice node moved ${guildId} from ${from.info.name} to ${to.info.name} at ${position}ms (${reason})`);
  }

  private voiceOf(guild: GuildVoice): null | {channelId: string, endpoint: string, sessionId: string, token: string} {
    const { channelId, endpoint, sessionId, token } = guild;
    return (channelId && endpoint && sessionId && token) ? {channelId, endpoint, sessionId, token} : null;
  }

  /**
   * The owner refresh is reloading this file: hands everything to the new instance (`adopt`) and stops this one, its
   * timers cleared and its node websockets closed without touching the players (the sessions are resuming, the nodes
   * keep them playing). We stay in the voice channels, the gateway isn't reloaded
   */
  detach(): VoiceNodeHandover {
    this.detached = true;
    // listens aren't handed over, the reloaded instance wouldn't know to stop them or deafen us again
    for (const guildId of Array.from(this.listens.keys())) {
      const guild = this.guilds.get(guildId);
      if (guild) {
        guild.node.updatePlayer(guildId, {listen: null}).catch(() => {});
      }
      this.endListen(guildId, 'left');
    }
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
    const guilds = Array.from(this.guilds).map(([guildId, guild]) => {
      const phase = snapshotPhase(guild.phase);
      const rejoin = (guild.rejoin) ? {left: guild.rejoin.left, since: guild.rejoin.since, stage: guild.rejoin.stage, tries: guild.rejoin.tries} : null;
      const { idleLeaving, rejoinPending, ...flags } = legacyFromState(phase, rejoin);
      const joining = !!guild.joinTimeout;
      // a pending pause alone is checked again by the new instance's next voice state, the idle leave waits the whole
      // delay again
      this.clearGuildTimers(guild);
      const { channelId, effects, endpoint, movedAt, node, position, sessionId, shard, speed, tempo, token, volume } = guild;
      // a copy, whatever this instance still has running (a command, a move) changes its own
      const handed: HandoverGuild = {
        ...flags,
        aloneTimeout: null,
        channelId,
        effects,
        endpoint,
        idleTimeout: null,
        joinTimeout: null,
        movedAt,
        moving: false,
        node,
        phase,
        position,
        rejoin,
        rejoinTimeout: null,
        sessionId,
        shard,
        speed,
        startQueue: !!flags.startQueue,
        tempo,
        token,
        volume,
      };
      return {guild: handed, guildId, idleLeaving: !!idleLeaving, joining, nodeId: guild.node.id, rejoinPending: !!rejoinPending};
    });
    const nodes = Array.from(this.nodes.values()).map((node) => ({
      disconnectedAt: node.disconnectedAt,
      failedAt: node.failedAt,
      info: node.info,
      reconnect: !!node.ws || node.state.name === 'reconnecting' || !!node.guildIds.length,
      restoring: !!node.restoring,
      sessionId: node.sessionId,
    }));
    const handover: VoiceNodeHandover = {
      closed: Promise.all(Array.from(this.nodes.values()).map((node) => node.retire())).then(() => {}),
      guilds,
      nodes,
      nodesFetchedAt: this.nodesFetchedAt,
      readyShards: Array.from(this.readyShards),
      recoveredSessions: Array.from(this.recoveredSessions),
      resumeDone: this.resumeDone,
      resumedPlayers: Array.from(this.resumedPlayers).map(([guildId, player]) => {
        return {channelId: player.channelId, effects: player.effects, guildId, idle: player.idle, nodeId: player.node.id, paused: player.paused, position: player.position, speed: player.speed, tempo: player.tempo, volume: player.volume};
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
   * closed (`READY` with `resumed`). Also how the old instance comes back when the new file failed to load. Guilds from
   * the code before phases only have their flags (`stateFromHandover`)
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
      node.failedAt = old.failedAt;
      node.outage = (old.disconnectedAt !== null) ? {failoverTimeout: null, since: old.disconnectedAt} : null;
      // the players' routes keep working with the session id until the websocket's back. one still being restored
      // after a restart is asked again (its players aren't ours yet), resuming from the saved session id
      node.sessionId = (old.restoring) ? null : old.sessionId;
      this.nodes.set(node.id, node);
    }
    const now = Date.now();
    for (const { guild: old, guildId, idleLeaving, joining, nodeId, rejoinPending } of handover.guilds) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        continue;
      }
      const state = stateFromHandover({...old, idleLeaving: !!idleLeaving, rejoinPending: !!rejoinPending}, now);
      const guild = new GuildVoice(old.shard, node, phaseFromSnapshot(state.phase));
      const { channelId, effects, endpoint, movedAt, position, sessionId, speed, tempo, token, volume } = old;
      Object.assign(guild, {channelId, effects, endpoint, movedAt, position, sessionId, speed, tempo, token, volume});
      let rejoin = state.rejoin;
      if (rejoin && rejoin.stage === 'awaitingVoice' && this.voiceOf(guild) && rejoin.left) {
        // its voice is all in, the rejoin's over (the stage just wasn't moved on before the handover)
        rejoin = {...rejoin, stage: 'done'};
      }
      if (state.fromFlags && rejoin && rejoin.stage !== 'done' && !rejoin.left) {
        // the old code clears these on the leave's voice state, which hasn't come
        guild.endpoint = guild.sessionId = guild.token = undefined;
      }
      guild.rejoin = (rejoin) ? {...rejoin, timeout: null} : null;
      this.guilds.set(guildId, guild);
      if (joining) {
        guild.joinTimeout = setTimeout(() => {
          guild.joinTimeout = null;
          if (this.guilds.get(guildId) === guild) {
            this.leave(guildId);
          }
        }, JOIN_TIMEOUT);
      }
      if (state.phase.name === 'idle' && state.phase.leaving) {
        this.leaveWhenIdle(guildId, guild);
      }
      if (guild.channelId) {
        this.rejoinLater(guildId, guild, guild.channelId);
      }
      this.awaitRejoinVoice(guildId, guild);
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
          node.connect(shard.userId).catch((error) => log.warn(`voice node ${node.info.name} resume`, error));
        }
      }
      // reloaded while starting up, what's left of it
      if (this.triedResume && !this.resumeDone) {
        this.resumeSessions(shard);
      }
    });
  }
}

function clearPhaseTimers(phase: GuildPhase) {
  if (phase.name === 'playing' && phase.aloneTimeout) {
    clearTimeout(phase.aloneTimeout);
    phase.aloneTimeout = null;
  } else if (phase.name === 'idle' && phase.leaveTimeout) {
    clearTimeout(phase.leaveTimeout);
    phase.leaveTimeout = null;
  }
}

export default new VoiceNodeClient();
