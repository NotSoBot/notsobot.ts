import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { DiscordAbortCodes, MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup, Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { deleteReminder, fetchReminders } from '../api';
import { RestResponsesRaw } from '../api/types';
import { RedisChannels, ONE_DAY, SNOWFLAKE_EPOCH } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';
import { createTimestampMomentFromGuild, getReminderMessage } from '../utils';


export interface ReminderItem {
  reminder: RestResponsesRaw.Reminder,
  timeout: Timers.Timeout,
}

class ReminderInterval extends Listener {
  // every 12 hours we will scan for reminders for the next 12 hour
  interval = new Timers.Interval();
  intervalTime = 12 * 60 * 60 * 1000;
  reminders = new Collections.BaseCollection<string, ReminderItem>();

  broadcastEvalInsert = ((moduleName: string, cluster: ClusterClient, reminder: RestResponsesRaw.Reminder) => {
    const store = require(moduleName).default as ReminderInterval;
    store.insertReminder(cluster, reminder);
  }).bind(null, __filename);

  broadcastEvalRemove = ((moduleName: string, cluster: ClusterClient, reminder: RestResponsesRaw.Reminder) => {
    const store = require(moduleName).default as ReminderInterval;
    store.removeReminder(reminder.id);
  }).bind(null, __filename);

  shouldHandle(cluster: ClusterClient): boolean {
    return cluster.clusterId === 0;
  }

  createReminderText(reminder: RestResponsesRaw.Reminder, expired: boolean = false): string {
    const createdAtUnix = Snowflake.timestamp(reminder.id, {epoch: SNOWFLAKE_EPOCH});
    const text = (reminder.content) ? Markup.codestring(reminder.content) : getReminderMessage(reminder.id);

    const mention = `<@${reminder.user.id}>`;
    const timestampText = Markup.timestamp(createdAtUnix, MarkupTimestampStyles.RELATIVE);
    if (expired) {
      const expiredTimestampText = Markup.timestamp(Date.parse(reminder.timestamp_start));
      return `${mention}, an expired reminder from ${timestampText} for ${expiredTimestampText}: ${text}`;
    }
    return `${mention}, reminder from ${timestampText}: ${text}`;
  }

  insertReminder(cluster: ClusterClient, reminder: RestResponsesRaw.Reminder): void {
    if (!this.shouldHandle(cluster)) {
      return;
    }

    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    if (this.reminders.has(reminder.id)) {
      return;
    }

    const now = Date.now();
    const timestamp = Date.parse(reminder.timestamp_start);
    const duration = Math.max(timestamp - now, 0);
    if (this.intervalTime < duration) {
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
    const allowedMentions = {
      repliedUser: true,
      users: [reminder.user.id],
    };

    // check to see if the user can see channelId first
    let channelId = reminder.channel_id || reminder.channel_id_backup;
    let dmChannelId = reminder.channel_id_backup;
    try {
      try {
        // channelId then channelIdBackup then fetchDm channel
        // maybe check perms using eval
        if (!channelId) {
          // fetch dm channel
          // maybe store this?
          const channel = await shard.rest.createDm({recipientId: reminder.user.id});
          channelId = dmChannelId = channel.id;
        }

        let messageReference: any;
        if (reminder.channel_id && reminder.message_id) {
          messageReference = {
            channelId,
            failIfNotExists: false,
            guildId: reminder.guild_id || undefined,
            messageId: reminder.message_id || undefined,
          };
        }

        await shard.rest.createMessage(channelId, {allowedMentions, content, messageReference});
      } catch(error) {
        // if error is unknown channel, try dm else ignore
        // if our channel id is already the dm channel id, ignore
        if (channelId && channelId !== dmChannelId) {
          try {
            switch (error.code) {
              case DiscordAbortCodes.INVALID_ACCESS:
              case DiscordAbortCodes.UNKNOWN_CHANNEL: {
                await shard.rest.createMessage(channelId, {allowedMentions, content});
              };
            }
          } catch(e) {

          }
        }
      } finally {
        this.removeReminder(reminder.id);
        await deleteReminder({client: shard}, reminder.id);
      }
    } catch(e) {

    }
  }

  async fetchReminders(
    shard: ShardClient,
    timestampMin: number,
    timestampMax: number,
  ): Promise<Collections.BaseCollection<string, RestResponsesRaw.Reminder>> {
    const reminders = new Collections.BaseCollection<string, RestResponsesRaw.Reminder>();

    let count = -1;

    let after: string | undefined;
    const limit = 1000;
    while (count === -1 || limit < count) {
      const response = await fetchReminders({client: shard}, {
        after,
        limit,
        timestampMax,
        timestampMin,
      });
      count = response.count;
      for (let reminder of response.reminders) {
        reminders.set(reminder.id, reminder);
      }
    }

    return reminders;
  }

  async scanForRemindersExpired(cluster: ClusterClient) {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    // Maybe limit to less than a week old?
    const reminders = await this.fetchReminders(shard, 0, Date.now());
    for (let [reminderId, reminder] of reminders) {
      const content = this.createReminderText(reminder, true);
      await this.executeReminder(shard, reminder, content);
    }
  }

  async scanForReminders(cluster: ClusterClient) {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    // from (now - 2 seconds) to (now + intervalTime (12 hours?))
    const reminders = await this.fetchReminders(shard, Date.now() - 2000, Date.now() + this.intervalTime);
    for (let [reminderId, reminder] of reminders) {
      this.insertReminder(cluster, reminder);
    }
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    // we only want to deal with reminders on cluster 0, cause we're awesome like that

    if (!this.shouldHandle(cluster)) {
      return [];
    }

    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = redis.subscribe(RedisChannels.REMINDER_CREATE, async (payload) => {
        this.insertReminder(cluster, payload);
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = redis.subscribe(RedisChannels.REMINDER_DELETE, async (payload) => {
        this.removeReminder(payload.id);
      });
      subscriptions.push(subscription);
    }

    this.scanForRemindersExpired(cluster);
    this.scanForReminders(cluster);
    this.interval.start(this.intervalTime, this.scanForReminders.bind(this, cluster));

    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    this.interval.stop();
  }
}

export default new ReminderInterval();
