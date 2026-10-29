import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup, Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { deleteReminder, fetchReminders } from '../api';
import { RestResponsesRaw } from '../api/types';
import { RedisChannels, SNOWFLAKE_EPOCH } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';


export interface ReminderItem {
  reminder: RestResponsesRaw.Reminder,
  timeout: Timers.Timeout,
}

class ReminderInterval extends Listener {
  // every 12 hours we will scan for reminders for the next 12 hour
  interval = new Timers.Interval();
  intervalTime = 12 * 60 * 60 * 1000;
  // reminders missed over the api events (like during a reconnect) would otherwise only be found on the next restart
  catchUpInterval = new Timers.Interval();
  catchUpIntervalTime = 5 * 60 * 1000;
  // scan a bit past the next interval so timer drift can't leave a gap between scans
  scanMargin = 5 * 60 * 1000;
  reminders = new Collections.BaseCollection<string, ReminderItem>();
  // reminders that were executed (or are executing) but not yet deleted from the api
  handled = new Set<string>();
  // pending retries for reminders whose delete failed
  deleteRetries = new Collections.BaseCollection<string, Timers.Timeout>();
  deleteRetryMin = 15 * 1000;
  deleteRetryMax = 10 * 60 * 1000;

  // the api's gateway only sends reminder events to shard 0's cluster (`EVENT_ROUTE_HOME` in its utilities/tools/redis.py),
  // moving this off cluster 0 means changing that route too
  shouldHandle(cluster: ClusterClient): boolean {
    return cluster.clusterId === 0;
  }

  createReminderText(reminder: RestResponsesRaw.Reminder, expired: boolean = false): string {
    const createdAtUnix = Snowflake.timestamp(reminder.id, {epoch: SNOWFLAKE_EPOCH});
    const text = reminder.content && Markup.codestring(reminder.content); //(reminder.content) ? Markup.codestring(reminder.content) : getReminderMessage(reminder.id);

    const mention = `<@${reminder.user.id}>`;
    const timestampText = Markup.timestamp(createdAtUnix, MarkupTimestampStyles.RELATIVE);
    if (expired) {
      const expiredTimestampText = Markup.timestamp(Date.parse(reminder.timestamp_start));
      if (text) {
        return `${mention}, an expired reminder from ${timestampText} for ${expiredTimestampText}: ${text}`;
      }
      return `${mention}, an expired reminder from ${timestampText} for ${expiredTimestampText}.`;
    }
    if (text) {
      return `${mention}, reminder from ${timestampText}: ${text}`;
    }
    return `${mention}, reminder from ${timestampText}.`;
  }

  insertReminder(cluster: ClusterClient, reminder: RestResponsesRaw.Reminder): void {
    if (!this.shouldHandle(cluster)) {
      return;
    }

    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    if (this.reminders.has(reminder.id) || this.handled.has(reminder.id)) {
      return;
    }

    const now = Date.now();
    const timestamp = Date.parse(reminder.timestamp_start);
    const duration = Math.max(timestamp - now, 0);
    if (this.intervalTime + this.scanMargin < duration) {
      // ignore this guy since he's so far into the future
      return;
    }

    const timeout = new Timers.Timeout();
    timeout.start(duration, async () => {
      const content = this.createReminderText(reminder);
      await this.executeReminder(shard, reminder, content);
    });
    this.reminders.set(reminder.id, {reminder, timeout});
  }

  removeReminder(reminderId: string): void {
    if (this.reminders.has(reminderId)) {
      const item = this.reminders.get(reminderId)!;
      item.timeout.stop();
      this.reminders.delete(reminderId);
    }
  }

  async executeReminder(
    shard: ShardClient,
    reminder: RestResponsesRaw.Reminder,
    content: string,
  ): Promise<void> {
    if (this.handled.has(reminder.id)) {
      return;
    }
    this.handled.add(reminder.id);
    this.removeReminder(reminder.id);

    const allowedMentions = {
      repliedUser: true,
      users: [reminder.user.id],
    };

    // try the original channel (replying to the message), then the backup channel, then a dm
    const channelIds: Array<string> = [];
    if (reminder.channel_id) {
      channelIds.push(reminder.channel_id);
    }
    if (reminder.channel_id_backup && !channelIds.includes(reminder.channel_id_backup)) {
      channelIds.push(reminder.channel_id_backup);
    }

    let sent = false;
    for (let channelId of channelIds) {
      let messageReference: any;
      if (channelId === reminder.channel_id && reminder.message_id) {
        messageReference = {
          channelId,
          failIfNotExists: false,
          guildId: reminder.guild_id || undefined,
          messageId: reminder.message_id,
        };
      }
      try {
        await shard.rest.createMessage(channelId, {allowedMentions, content, messageReference});
        sent = true;
        break;
      } catch(error) {

      }
    }

    if (!sent) {
      try {
        const channel = await shard.rest.createDm({recipientId: reminder.user.id});
        if (!channelIds.includes(channel.id)) {
          await shard.rest.createMessage(channel.id, {allowedMentions, content});
        }
      } catch(error) {
        // user has dms closed or we can't reach them, nothing else to do
      }
    }

    await this.deleteHandledReminder(shard, reminder.id);
  }

  async deleteHandledReminder(shard: ShardClient, reminderId: string, attempt: number = 0): Promise<void> {
    this.stopDeleteRetry(reminderId);
    try {
      await deleteReminder({client: shard}, reminderId);
    } catch(error) {
      // a 404 means it's already gone
      if (!(error.response && error.response.statusCode === 404)) {
        // keep it in `handled` so we don't send it again, and retry the delete with backoff
        const delay = Math.min(this.deleteRetryMin * Math.pow(2, attempt), this.deleteRetryMax);
        console.error(`Failed to delete reminder ${reminderId}, retrying in ${delay}ms`, error);
        const timeout = new Timers.Timeout();
        timeout.start(delay, () => this.deleteHandledReminder(shard, reminderId, attempt + 1));
        this.deleteRetries.set(reminderId, timeout);
        return;
      }
    }
    this.handled.delete(reminderId);
  }

  stopDeleteRetry(reminderId: string): void {
    if (this.deleteRetries.has(reminderId)) {
      this.deleteRetries.get(reminderId)!.stop();
      this.deleteRetries.delete(reminderId);
    }
  }

  async retryHandledDeletes(shard: ShardClient): Promise<void> {
    // safety net for anything that isn't already being sent or retried (e.g. after a stop/reconnect)
    for (let reminderId of Array.from(this.handled)) {
      if (!this.reminders.has(reminderId) && !this.deleteRetries.has(reminderId)) {
        await this.deleteHandledReminder(shard, reminderId);
      }
    }
  }

  async fetchReminders(
    shard: ShardClient,
    timestampMin: number,
    timestampMax: number,
  ): Promise<Collections.BaseCollection<string, RestResponsesRaw.Reminder>> {
    const reminders = new Collections.BaseCollection<string, RestResponsesRaw.Reminder>();

    let after: string | undefined;
    const limit = 1000;
    while (true) {
      const response = await fetchReminders({client: shard}, {
        after,
        limit,
        timestampMax,
        timestampMin,
      });
      for (let reminder of response.reminders) {
        reminders.set(reminder.id, reminder);
      }

      const last = response.reminders[response.reminders.length - 1];
      if (!last || response.reminders.length < limit || last.id === after) {
        break;
      }
      after = last.id;
    }

    return reminders;
  }

  async scanForRemindersExpired(cluster: ClusterClient, timestampMax: number) {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    // Maybe limit to less than a week old?
    const reminders = await this.fetchReminders(shard, 0, timestampMax);
    for (let [reminderId, reminder] of reminders) {
      if (this.reminders.has(reminderId) || this.handled.has(reminderId)) {
        continue;
      }
      const content = this.createReminderText(reminder, true);
      await this.executeReminder(shard, reminder, content);
    }
  }

  async scanForReminders(cluster: ClusterClient, timestampMin?: number, timestampMax?: number) {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    await this.retryHandledDeletes(shard);

    // from (now - 2 seconds) to (now + intervalTime (12 hours?) + margin)
    const now = Date.now();
    if (timestampMin === undefined) {
      timestampMin = now - 2000;
    }
    if (timestampMax === undefined) {
      timestampMax = now + this.intervalTime + this.scanMargin;
    }
    const reminders = await this.fetchReminders(shard, timestampMin, timestampMax);
    for (let [reminderId, reminder] of reminders) {
      this.insertReminder(cluster, reminder);
    }
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    // we only want to deal with reminders on cluster 0, cause we're awesome like that

    if (!this.shouldHandle(cluster)) {
      return [];
    }

    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = apiEvents.subscribe(RedisChannels.REMINDER_CREATE, async (payload) => {
        this.insertReminder(cluster, payload);
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = apiEvents.subscribe(RedisChannels.REMINDER_DELETE, async (payload) => {
        this.removeReminder(payload.id);
      });
      subscriptions.push(subscription);
    }

    {
      // reschedule with the new data (like being moved to dms or a new time)
      // insertReminder skips ones that are already being sent or too far in the future
      const subscription = apiEvents.subscribe(RedisChannels.REMINDER_UPDATE, async (payload) => {
        this.removeReminder(payload.id);
        this.insertReminder(cluster, payload);
      });
      subscriptions.push(subscription);
    }

    {
      // missed deletes/updates would leave stale timers around, reschedule everything from the api
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.resync(cluster).catch((error) => {
          console.error('Failed to resync reminders', error);
        });
      });
      subscriptions.push(subscription);
    }

    this.startup(cluster).catch((error) => {
      console.error('Failed to scan for reminders on startup', error);
    });
    this.interval.start(this.intervalTime, () => {
      this.scanForReminders(cluster).catch((error) => {
        console.error('Failed to scan for reminders', error);
      });
    });
    // send overdue ones that nothing scheduled, then schedule the ones due before the next catch up
    // (both skip reminders that are already scheduled or being sent)
    this.catchUpInterval.start(this.catchUpIntervalTime, async () => {
      try {
        const now = Date.now();
        await this.scanForRemindersExpired(cluster, now - 2000);
        await this.scanForReminders(cluster, now - 2000, now + this.catchUpIntervalTime + this.scanMargin);
      } catch(error) {
        console.error('Failed to catch up on reminders', error);
      }
    });

    return subscriptions;
  }

  async resync(cluster: ClusterClient): Promise<void> {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    // remember what was scheduled before fetching, anything an event changes while we wait is newer than the fetch
    const scheduled = new Map<string, ReminderItem>();
    for (let [reminderId, item] of this.reminders) {
      scheduled.set(reminderId, item);
    }

    // fetch before dropping anything so a failed fetch keeps the current timers
    const now = Date.now();
    const timestampMin = now - 2000;
    const reminders = await this.fetchReminders(shard, timestampMin, now + this.intervalTime + this.scanMargin);
    for (let [reminderId, item] of scheduled) {
      // older ones are outside what we fetched and about to fire anyways
      if (this.reminders.get(reminderId) === item && timestampMin <= Date.parse(item.reminder.timestamp_start)) {
        this.removeReminder(reminderId);
      }
    }
    // skips the ones that were sent or rescheduled by an event in the meantime
    for (let [reminderId, reminder] of reminders) {
      this.insertReminder(cluster, reminder);
    }
    await this.scanForRemindersExpired(cluster, timestampMin);
  }

  async startup(cluster: ClusterClient) {
    // reschedule deletes that a stop() cleared before anything else, so a failed scan below can't strand them until the next interval
    const shard = cluster.shards.first();
    if (shard) {
      await this.retryHandledDeletes(shard);
    }

    // run these one after the other so a reminder in the overlap isn't sent twice
    const now = Date.now();
    await this.scanForRemindersExpired(cluster, now - 2000);
    await this.scanForReminders(cluster, now - 2000);
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    this.interval.stop();
    this.catchUpInterval.stop();
    for (let [reminderId, item] of this.reminders) {
      item.timeout.stop();
    }
    this.reminders.clear();
    for (let [reminderId, timeout] of this.deleteRetries) {
      timeout.stop();
    }
    this.deleteRetries.clear();
  }
}

export default new ReminderInterval();
