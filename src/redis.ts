import { EventSpewer, Timers } from 'detritus-utils';
import { createClient, RedisClient } from 'redis';
import * as Sentry from '@sentry/node';

import { RedisChannels } from './constants';
import { RedisPayloads } from './types';


export class RedisSpewer extends EventSpewer {
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
        const data = JSON.parse(message);
        this.emit(channel, data);
      }
    });

    for (let channel of Object.values(RedisChannels)) {
      this.client.subscribe(channel);
    }
  }

  end(): void {
    if (!this.ended && this.client) {
      this.client.end(true);
      this.client.removeAllListeners();
      this.ended = true;
    }
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: RedisChannels.GUILD_SETTINGS_UPDATE, listener: (payload: RedisPayloads.GuildSettingsUpdate) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}

export default new RedisSpewer(process.env.REDIS_URL || '');
