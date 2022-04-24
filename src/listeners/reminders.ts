import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { DiscordAbortCodes, MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup, Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { deleteReminder, fetchReminders } from '../api';
import { RestResponsesRaw } from '../api/types';
import { RedisChannels, SNOWFLAKE_EPOCH } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';
import { createTimestampMomentFromGuild, getReminderMessage } from '../utils';



export interface ReminderItem {
  reminder: RestResponsesRaw.Reminder,
  timeout: Timers.Timeout,
}

class ReminderInterval extends Listener {
  // every 6 hours we will scan for reminders for the next hour
  interval = new Timers.Interval();
  intervalTime = 6 * 60 * 60 * 1000;
  reminders = new Collections.BaseCollection<string, ReminderItem>();

  insertReminder(cluster: ClusterClient, reminder: RestResponsesRaw.Reminder): void {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    if (this.reminders.has(reminder.id)) {
      return;
    }

    const now = Date.now();
    const timestamp = Date.parse(reminder.timestamp_start);
    const duration = timestamp - now;
    if (this.intervalTime < duration) {
      // ignore this guy since he's so far into the future
      return;
    }

    const timeout = new Timers.Timeout();
    timeout.start(duration, async () => {
      const allowedMentions = {
        repliedUser: true,
        users: [reminder.user.id],
      };
      const createdAtUnix = Snowflake.timestamp(reminder.id, {epoch: SNOWFLAKE_EPOCH});
      const text = (reminder.content) ? Markup.codestring(reminder.content) : getReminderMessage(reminder.id);
      const content = `<@${reminder.user.id}>, reminder from ${Markup.timestamp(createdAtUnix, MarkupTimestampStyles.RELATIVE)}: ${text}`;

      let channelId = reminder.channel_id || reminder.channel_id_backup;
      let dmChannelId = reminder.channel_id_backup;
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
        if (reminder.guild_id && reminder.message_id) {
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
        return deleteReminder({client: shard}, reminder.id);
      }
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

  async scanForReminders(cluster: ClusterClient) {
    const shard = cluster.shards.first();
    if (!shard) {
      return;
    }

    let count = -1;

    let after: string | undefined;
    const limit = 1000;
    const timestampMax = Date.now() + this.intervalTime;
    const timestampMin = Date.now();
    while (count === -1 || limit < count) {
      const response = await fetchReminders({client: shard}, {
        after,
        limit,
        timestampMax,
        timestampMin,
      });
      count = response.count;
      for (let x of response.reminders) {
        this.insertReminder(cluster, x);
      }
    }
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    // we only want to deal with reminders on cluster 0, cause we're awesome like that

    if (cluster.clusterId !== 0) {
      return [];
    }

    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = redis.subscribe(RedisChannels.REMINDER_CREATE, async (payload) => {
        console.log(payload);
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
