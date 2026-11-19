import { ClusterClient, ShardClient } from 'detritus-client';
import { Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { RestResponsesRaw } from '../api/types';
import { ApiEventsSpewer } from '../apievents';
import { log } from '../log';
import DecoyStore from '../stores/decoys';
import { Formatter } from '../utils';
import { createDecoyWebhookName, pickDecoyBait } from '../utils/decoy';

import { Listener } from './listener';


// how long a bait message stays up before the webhook deletes it
const BAIT_LIFETIME = 1500;
// the first bait after a start or a change, somewhere in here so a restart doesn't post in every decoy at once
const FIRST_BAIT_MIN = 60 * 1000;
const FIRST_BAIT_MAX = 15 * 60 * 1000;
// discord's unknown webhook, someone deleted it
const UNKNOWN_WEBHOOK = 10015;
// how many old messages the start-up sweep looks at, and bulk delete's two week limit
const SWEEP_LIMIT = 50;
const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;


/**
 * Keeps every decoy channel on this cluster looking used: the webhook posts something now and then and deletes it a
 * moment later, which moves the channel's last message (it doesn't move back on a delete) without leaving anything but
 * the notice. Each channel gets its own randomized timer around its `bait_interval`. Webhook token requests don't go
 * through the bot's global ratelimit. Also sweeps each channel once per start, for whatever was posted while I was
 * offline (deleted only, nobody's removed for it).
 */
class DecoyBaitScheduler extends Listener {
  timers = new Map<string, Timers.Timeout>();
  swept = new Set<string>();
  updateListener: ((guildId: string, decoy: RestResponsesRaw.GuildDecoy | null) => void) | null = null;

  schedule(cluster: ClusterClient, guildId: string, decoy: RestResponsesRaw.GuildDecoy | null, first: boolean = false): void {
    const existing = this.timers.get(guildId);
    if (existing) {
      existing.stop();
      this.timers.delete(guildId);
    }
    if (!decoy) {
      return;
    }
    const shard = cluster.shards.find((x) => x.guilds.has(guildId)) || null;
    if (shard && !this.swept.has(decoy.channel_id)) {
      this.swept.add(decoy.channel_id);
      this.sweep(shard, decoy).catch((error) => log.error(`Decoy sweep failed for ${guildId}`, error));
    }
    if (!decoy.bait_enabled || !decoy.webhook_id || !decoy.webhook_token) {
      return;
    }
    const interval = decoy.bait_interval * 1000;
    // anywhere from half to one and a half times the interval
    const delay = (first) ? FIRST_BAIT_MIN + Math.random() * (FIRST_BAIT_MAX - FIRST_BAIT_MIN) : interval * (0.5 + Math.random());
    const timeout = new Timers.Timeout();
    timeout.start(delay, () => {
      this.timers.delete(guildId);
      const current = DecoyStore.get(guildId) || null;
      this.bait(cluster, current).catch((error) => {
        log.error(`Decoy bait failed for ${guildId}`, error);
      }).finally(() => {
        // the next one, unless something changed it meanwhile (that already scheduled one)
        if (!this.timers.has(guildId)) {
          this.schedule(cluster, guildId, DecoyStore.get(guildId) || null);
        }
      });
    });
    this.timers.set(guildId, timeout);
  }

  async bait(cluster: ClusterClient, decoy: RestResponsesRaw.GuildDecoy | null): Promise<void> {
    if (!decoy || !decoy.bait_enabled || !decoy.webhook_id || !decoy.webhook_token) {
      return;
    }
    const shard = cluster.shards.find((x) => x.guilds.has(decoy.guild_id));
    if (!shard) {
      return;
    }
    const { webhook_id: webhookId, webhook_token: webhookToken } = decoy;
    let messageId: string;
    try {
      const message = await shard.rest.executeWebhook(webhookId, webhookToken, {
        allowedMentions: {parse: []},
        content: pickDecoyBait(),
        wait: true,
      });
      // `wait` makes discord send the message back
      if (!message) {
        return;
      }
      messageId = message.id;
    } catch(error: any) {
      if (error && error.code === UNKNOWN_WEBHOOK) {
        await this.replaceWebhook(shard, decoy);
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, BAIT_LIFETIME));
    try {
      await shard.rest.deleteWebhookTokenMessage(webhookId, webhookToken, messageId);
    } catch(error) {
      // the webhook went in between, I can still delete it myself with manage messages
      await shard.rest.deleteMessage(decoy.channel_id, messageId).catch(() => null);
    }
  }

  // someone deleted the webhook: a new one when I can make it, otherwise the bait stops and the status says why
  async replaceWebhook(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy): Promise<void> {
    const channel = shard.channels.get(decoy.channel_id);
    let webhookId: string | null = null;
    let webhookToken: string | null = null;
    if (channel && channel.canManageWebhooks) {
      try {
        const webhook = await channel.createWebhook({name: createDecoyWebhookName(channel.name)});
        webhookId = webhook.id;
        webhookToken = webhook.token || null;
      } catch(error) {
        // the channel's webhook limit, or permissions changed
      }
    }
    await Formatter.Commands.ServerDecoy.editDecoy({client: shard}, decoy.guild_id, {
      webhookId: (webhookToken) ? webhookId : null,
      webhookToken,
    });
  }

  // anything but the notice in the last messages goes, posted while I was offline
  async sweep(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy): Promise<void> {
    const channel = shard.channels.get(decoy.channel_id);
    if (!channel || !channel.canManageMessages || !channel.canReadHistory) {
      return;
    }
    const messages = await shard.rest.fetchMessages(channel.id, {limit: SWEEP_LIMIT});
    const now = Date.now();
    const ids: Array<string> = [];
    const old: Array<string> = [];
    for (let [messageId] of messages) {
      if (messageId === decoy.notice_message_id) {
        continue;
      }
      if (now - Snowflake.timestamp(messageId) < BULK_DELETE_MAX_AGE - 60 * 1000) {
        ids.push(messageId);
      } else {
        old.push(messageId);
      }
    }
    if (2 <= ids.length) {
      await shard.rest.bulkDeleteMessages(channel.id, ids);
    } else if (ids.length) {
      await shard.rest.deleteMessage(channel.id, ids[0]);
    }
    for (let messageId of old.slice(0, 10)) {
      await shard.rest.deleteMessage(channel.id, messageId).catch(() => null);
    }
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    if (this.updateListener) {
      DecoyStore.updateListeners.delete(this.updateListener);
    }
    this.updateListener = (guildId, decoy) => {
      // a change that keeps the bait as it was doesn't move its timer
      const timer = this.timers.get(guildId);
      if (decoy && timer && decoy.bait_enabled && decoy.webhook_id) {
        return;
      }
      this.schedule(cluster, guildId, decoy, true);
    };
    DecoyStore.updateListeners.add(this.updateListener);
    // the store may have loaded before this connected
    for (let [guildId, decoy] of DecoyStore) {
      this.schedule(cluster, guildId, decoy, true);
    }
    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    if (this.updateListener) {
      DecoyStore.updateListeners.delete(this.updateListener);
      this.updateListener = null;
    }
    for (let [guildId, timer] of this.timers) {
      timer.stop();
    }
    this.timers.clear();
  }
}

export default new DecoyBaitScheduler();
