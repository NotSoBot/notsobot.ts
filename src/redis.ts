import { EventSpewer, Timers } from 'detritus-utils';
import { createClient, RedisClient } from 'redis';
import * as Sentry from '@sentry/node';

import { RedisChannels } from './constants';
import { RedisPayloads } from './types';


export class RedisSpewer extends EventSpewer {
  channels: Array<string> = [];
  client!: RedisClient;
  ended: boolean = false;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.client = createClient(this.url, {
      retry_strategy: (options) => {
        return Math.min(options.attempt * 1000, 3000);
      },
    });
    this.client.on('error', (error) => {
      Sentry.captureException(error);
    });
    this.client.on('message', (channel: string, message: string) => {
      if (channel in RedisChannels) {
        try {
          const data = (message) ? JSON.parse(message) : null;
          this.emit(channel, data);
        } catch(error) {
          Sentry.captureException(error);
        }
      }
    });

    this.subscribeToChannels(Object.values(RedisChannels));
  }

  end(): void {
    if (!this.ended && this.client) {
      this.client.end(true);
      this.client.removeAllListeners();
      this.ended = true;
    }
  }

  subscribeToChannels(channels: Array<string>) {
    for (let channel of this.channels) {
      this.client.unsubscribe(channel);
    }
    for (let channel of channels) {
      this.client.subscribe(channel);
    }
    this.channels = channels;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: RedisChannels.GUILD_SETTINGS_UPDATE, listener: (payload: RedisPayloads.GuildSettingsUpdate) => any): this;
  on(event: RedisChannels.REMINDER_CREATE, listener: (payload: RedisPayloads.ReminderCreate) => any): this;
  on(event: RedisChannels.REMINDER_DELETE, listener: (payload: RedisPayloads.ReminderDelete) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}

export default new RedisSpewer(process.env.REDIS_URL || '');
