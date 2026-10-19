import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { deleteGuildTimedBan, deleteGuildTimedBans, fetchTimedBans } from '../api';
import { RestResponsesRaw } from '../api/types';
import { DateMomentLogFormat, RedisChannels, SNOWFLAKE_EPOCH } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { createTimestampMomentFromGuild, formatDuration, formatUserTag } from '../utils';
import { Translator, getTranslatorForGuildId } from '../utils/i18n';


// discord's error codes for what to do with a timed ban whose unban failed
export const DiscordErrorCodes = Object.freeze({
  // we're not in the server (anymore), keep it in case we get added back with ban members
  MISSING_ACCESS: 50001,
  UNKNOWN_GUILD: 10004,
  // they were already unbanned, nothing left to do
  UNKNOWN_BAN: 10026,
  // we're in the server but lost ban members, don't keep trying
  MISSING_PERMISSIONS: 50013,
});

export interface TimedBanItem {
  timedBan: RestResponsesRaw.TimedBan,
  timeout: Timers.Timeout,
}

export interface GuildQueue {
  items: Array<RestResponsesRaw.TimedBan>,
  running: boolean,
}

// lifts timed bans (`ban -for`) once they're over, the same way reminders get sent: everything due in the next 12 hours
// gets a timer, a catch up every 5 minutes picks up anything overdue, and api events add/remove them in between
class TimedBanScheduler extends Listener {
  interval = new Timers.Interval();
  intervalTime = 12 * 60 * 60 * 1000;
  catchUpInterval = new Timers.Interval();
  catchUpIntervalTime = 5 * 60 * 1000;
  scanMargin = 5 * 60 * 1000;
  // unbans go out one at a time per server with this much time between them, so a mass ban ending doesn't turn into a
  // burst of unbans (and the api limits how many can end around the same time to begin with)
  paceTime = 2 * 1000;
  // servers we're not in anymore, checked again this often instead of every catch up
  notInGuildRetryTime = 60 * 60 * 1000;

  timedBans = new Collections.BaseCollection<string, TimedBanItem>();
  queues = new Collections.BaseCollection<string, GuildQueue>();
  // queued or being unbanned right now
  queued = new Set<string>();
  // timed ban id -> when to try again, for servers we're not in
  deferred = new Map<string, number>();

  shouldHandle(cluster: ClusterClient): boolean {
    return cluster.clusterId === 0;
  }

  insertTimedBan(cluster: ClusterClient, timedBan: RestResponsesRaw.TimedBan): void {
    if (!this.shouldHandle(cluster) || this.timedBans.has(timedBan.id) || this.queued.has(timedBan.id)) {
      return;
    }
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    const duration = Math.max(Date.parse(timedBan.timestamp_end) - Date.now(), 0);
    if (this.intervalTime + this.scanMargin < duration) {
      // the 12 hour scan picks it up when it's closer
      return;
    }

    const timeout = new Timers.Timeout();
    timeout.start(duration, () => {
      this.timedBans.delete(timedBan.id);
      this.enqueue(shard, timedBan);
    });
    this.timedBans.set(timedBan.id, {timedBan, timeout});
  }

  removeTimedBan(timedBanId: string): void {
    const item = this.timedBans.get(timedBanId);
    if (item) {
      item.timeout.stop();
      this.timedBans.delete(timedBanId);
    }
    this.deferred.delete(timedBanId);
    // drop it from its server's queue if it hasn't started yet
    for (let [guildId, queue] of this.queues) {
      const index = queue.items.findIndex((x) => x.id === timedBanId);
      if (index !== -1) {
        queue.items.splice(index, 1);
        this.queued.delete(timedBanId);
      }
    }
  }

  enqueue(shard: ShardClient, timedBan: RestResponsesRaw.TimedBan): void {
    if (this.queued.has(timedBan.id)) {
      return;
    }
    const deferredUntil = this.deferred.get(timedBan.id);
    if (deferredUntil && Date.now() < deferredUntil) {
      return;
    }
    this.deferred.delete(timedBan.id);

    let queue = this.queues.get(timedBan.guild_id);
    if (!queue) {
      queue = {items: [], running: false};
      this.queues.set(timedBan.guild_id, queue);
    }
    queue.items.push(timedBan);
    queue.items.sort((x, y) => Date.parse(x.timestamp_end) - Date.parse(y.timestamp_end));
    this.queued.add(timedBan.id);
    this.runQueue(shard, timedBan.guild_id);
  }

  async runQueue(shard: ShardClient, guildId: string): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue || queue.running) {
      return;
    }
    queue.running = true;
    try {
      while (queue.items.length) {
        const timedBan = queue.items.shift()!;
        try {
          await this.executeUnban(shard, timedBan);
        } catch(error) {
          console.error(`Failed to lift timed ban ${timedBan.id}`, error);
        }
        this.queued.delete(timedBan.id);
        if (queue.items.length) {
          await new Promise((resolve) => setTimeout(resolve, this.paceTime));
        }
      }
    } finally {
      queue.running = false;
      if (!queue.items.length) {
        this.queues.delete(guildId);
      }
    }
  }

  async createReason(shard: ShardClient, timedBan: RestResponsesRaw.TimedBan): Promise<string> {
    // in the server's language since the whole server sees it, laid out like the ban's own reason
    const { language, translate } = await getTranslatorForGuildId({client: shard}, timedBan.guild_id);
    let moderator = shard.users.get(timedBan.moderator_id);
    if (!moderator) {
      // cluster 0 only has its own servers' users cached
      try {
        moderator = await shard.rest.fetchUser(timedBan.moderator_id);
      } catch(error) {}
    }
    const description: Array<string> = [];
    description.push(translate('moderation_ban.moderator', {
      user: (moderator) ? formatUserTag(moderator) : timedBan.moderator_id,
      user2: timedBan.moderator_id,
    }));
    description.push(translate('moderation_ban.date', {
      timestamp: createTimestampMomentFromGuild(Date.now(), timedBan.guild_id).format(DateMomentLogFormat),
    }));
    {
      // the timed ban is saved right as they get banned, so its id is when they got banned (rounded since the end was
      // picked a few ms before the id was made)
      const bannedAt = Snowflake.timestamp(timedBan.id, {epoch: SNOWFLAKE_EPOCH});
      const duration = Math.round((Date.parse(timedBan.timestamp_end) - bannedAt) / 1000) * 1000;
      description.push(translate('timed_bans.expired', {
        duration: formatDuration(duration, language),
        timestamp: createTimestampMomentFromGuild(bannedAt, timedBan.guild_id).format(DateMomentLogFormat),
      }));
    }
    description.push(translate('moderation_ban.reason', {
      text: (await this.fetchBanReason(shard, timedBan, translate)) || translate('moderation.unspecified_reason'),
    }));
    return description.join('\n').slice(0, 512);
  }

  // the reason isn't saved with the timed ban, so it comes from the ban's audit log reason that the ban command wrote
  // (`Moderator: ...\nDate: ...\nDuration: ...\nReason: {text}`, the text last)
  async fetchBanReason(shard: ShardClient, timedBan: RestResponsesRaw.TimedBan, translate: Translator['translate']): Promise<string | null> {
    let reason: string | null = null;
    try {
      const ban = await shard.rest.fetchGuildBan(timedBan.guild_id, timedBan.user_id);
      reason = ban.reason || null;
    } catch(error) {
      // the unban right after runs into the same error and handles it
      return null;
    }
    if (!reason) {
      return null;
    }
    const [ prefix ] = translate('moderation_ban.reason', {text: '\u0000'}).split('\u0000');
    const index = (reason.startsWith(prefix)) ? 0 : reason.lastIndexOf(`\n${prefix}`);
    if (index !== -1) {
      return reason.slice(index + ((index) ? 1 : 0) + prefix.length).trim() || null;
    }
    // banned some other way (or the server's language changed since), a multi-line reason is someone else's layout
    return (reason.includes('\n')) ? null : reason;
  }

  async executeUnban(shard: ShardClient, timedBan: RestResponsesRaw.TimedBan): Promise<void> {
    try {
      await shard.rest.removeGuildBan(timedBan.guild_id, timedBan.user_id, {reason: await this.createReason(shard, timedBan)});
    } catch(error) {
      switch (error && error.code) {
        case DiscordErrorCodes.UNKNOWN_BAN:
        case DiscordErrorCodes.MISSING_PERMISSIONS: {
          // already unbanned, or we can't unban anymore: either way it's done
        }; break;
        case DiscordErrorCodes.MISSING_ACCESS:
        case DiscordErrorCodes.UNKNOWN_GUILD: {
          // we're not in the server, keep it for if we get added back
          this.deferred.set(timedBan.id, Date.now() + this.notInGuildRetryTime);
          return;
        };
        default: {
          // anything else (discord being down, network) gets tried again on the next catch up
          throw error;
        };
      }
    }

    try {
      // only if it's still this one, a ban with a new time could've replaced it right after our unban
      await deleteGuildTimedBan({client: shard}, timedBan.guild_id, timedBan.user_id, {timedBanId: timedBan.id});
    } catch(error) {
      // a 404 means it's already gone, otherwise the next catch up finds it overdue again, and the unban comes back as
      // UNKNOWN_BAN which deletes it then
      if (!(error.response && error.response.statusCode === 404)) {
        console.error(`Failed to delete timed ban ${timedBan.id}`, error);
      }
    }
  }

  async fetchTimedBans(
    shard: ShardClient,
    timestampMin: number,
    timestampMax: number,
  ): Promise<Collections.BaseCollection<string, RestResponsesRaw.TimedBan>> {
    const timedBans = new Collections.BaseCollection<string, RestResponsesRaw.TimedBan>();

    let after: string | undefined;
    const limit = 1000;
    while (true) {
      const response = await fetchTimedBans({client: shard}, {after, limit, timestampMax, timestampMin});
      for (let timedBan of response.timed_bans) {
        timedBans.set(timedBan.id, timedBan);
      }

      const last = response.timed_bans[response.timed_bans.length - 1];
      if (!last || response.timed_bans.length < limit || last.id === after) {
        break;
      }
      after = last.id;
    }
    return timedBans;
  }

  async scanForOverdue(cluster: ClusterClient, timestampMax: number): Promise<void> {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }
    const timedBans = await this.fetchTimedBans(shard, 0, timestampMax);
    for (let [timedBanId, timedBan] of timedBans) {
      if (!this.timedBans.has(timedBanId)) {
        this.enqueue(shard, timedBan);
      }
    }
  }

  async scanForTimedBans(cluster: ClusterClient, timestampMin?: number, timestampMax?: number): Promise<void> {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }
    const now = Date.now();
    if (timestampMin === undefined) {
      timestampMin = now - 2000;
    }
    if (timestampMax === undefined) {
      timestampMax = now + this.intervalTime + this.scanMargin;
    }
    const timedBans = await this.fetchTimedBans(shard, timestampMin, timestampMax);
    for (let [timedBanId, timedBan] of timedBans) {
      this.insertTimedBan(cluster, timedBan);
    }
  }

  async catchUp(cluster: ClusterClient): Promise<void> {
    const now = Date.now();
    await this.scanForOverdue(cluster, now - 2000);
    await this.scanForTimedBans(cluster, now - 2000, now + this.catchUpIntervalTime + this.scanMargin);
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      // someone got unbanned (by hand, or by us), so their timed ban shouldn't do anything later. every cluster sees its
      // own servers' unbans
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_REMOVE, async (event) => {
        const { guildId, shard, user } = event;
        try {
          await deleteGuildTimedBans({client: shard}, guildId, {userIds: [user.id]});
        } catch(error) {
          // the scheduler's unban would just come back as UNKNOWN_BAN and delete it then
        }
      });
      subscriptions.push(subscription);
    }

    // the scheduling itself only runs on cluster 0, like reminders (it only needs rest, not the server cached)
    if (!this.shouldHandle(cluster)) {
      return subscriptions;
    }

    subscriptions.push(apiEvents.subscribe(RedisChannels.TIMED_BAN_CREATE, (payload) => {
      if (Date.parse(payload.timestamp_end) <= Date.now()) {
        const shard = cluster.shards.first();
        if (shard) {
          this.enqueue(shard, payload);
        }
      } else {
        this.insertTimedBan(cluster, payload);
      }
    }));
    subscriptions.push(apiEvents.subscribe(RedisChannels.TIMED_BAN_DELETE, (payload) => {
      this.removeTimedBan(payload.id);
    }));
    subscriptions.push(apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
      // missed deletes would leave stale timers around, start over from the api (fetching before dropping anything)
      this.resync(cluster).catch((error) => console.error('Failed to resync timed bans', error));
    }));

    this.catchUp(cluster).catch((error) => console.error('Failed to scan for timed bans on startup', error));
    this.interval.start(this.intervalTime, () => {
      this.scanForTimedBans(cluster).catch((error) => console.error('Failed to scan for timed bans', error));
    });
    this.catchUpInterval.start(this.catchUpIntervalTime, () => {
      this.catchUp(cluster).catch((error) => console.error('Failed to catch up on timed bans', error));
    });

    return subscriptions;
  }

  async resync(cluster: ClusterClient): Promise<void> {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }
    const now = Date.now();
    const timedBans = await this.fetchTimedBans(shard, now - 2000, now + this.intervalTime + this.scanMargin);
    for (let [timedBanId, item] of this.timedBans) {
      if (!timedBans.has(timedBanId)) {
        this.removeTimedBan(timedBanId);
      }
    }
    for (let [timedBanId, timedBan] of timedBans) {
      this.insertTimedBan(cluster, timedBan);
    }
    await this.scanForOverdue(cluster, now - 2000);
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    this.interval.stop();
    this.catchUpInterval.stop();
    for (let [timedBanId, item] of this.timedBans) {
      item.timeout.stop();
    }
    this.timedBans.clear();
    // whatever is mid-unban finishes on its own, the rest gets picked up again as overdue after a restart
    for (let [guildId, queue] of this.queues) {
      for (let timedBan of queue.items) {
        this.queued.delete(timedBan.id);
      }
      queue.items.length = 0;
    }
  }
}

export default new TimedBanScheduler();
