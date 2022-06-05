import { EventSpewer, Timers } from 'detritus-utils';
import { createClient, RedisClientType } from 'redis';
import * as Sentry from '@sentry/node';

import { RedisChannels } from './constants';
import { RedisPayloads } from './types';


export class RedisSpewer extends EventSpewer {
  channels: Array<string> = [];
  client!: RedisClientType;
  ended: boolean = false;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.client = createClient({
      url: this.url,
    });
    this.client.on('error', (error) => {
      Sentry.captureException(error);
    });
    this.subscribeToChannels(Object.values(RedisChannels));
  }

  end(): void {
    if (!this.ended && this.client) {
      this.client.quit();
      this.client.removeAllListeners();
      this.ended = true;
    }
  }

  onMessage(channel: string, message: string) {
    if (channel in RedisChannels) {
      try {
        const data = (message) ? JSON.parse(message) : null;
        this.emit(channel, data);
      } catch(error) {
        Sentry.captureException(error);
      }
    }
  }

  async subscribeToChannels(channels: Array<string>) {
    if (!this.client.isOpen) {
      await this.client.connect().catch(() => {});
    }
    for (let channel of this.channels) {
      await this.client.unsubscribe(channel).catch(() => {});
    }
    for (let channel of channels) {
      await this.client.subscribe(channel, (message) => {
        this.onMessage(channel, message);
      }).catch(() => {});
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
