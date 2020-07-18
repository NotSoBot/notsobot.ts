import { EventSpewer, Timers } from 'detritus-utils';
import { createClient, RedisClient } from 'redis';

import { RedisChannels } from './constants';
import { RedisPayloads } from './types';


export class RedisSpewer extends EventSpewer {
  client!: RedisClient;
  ended: boolean = false;

  constructor(url: string) {
    super();
    this.initialize(url);
  }

  initialize(url: string): void {
    this.client = createClient(url);
    this.ended = false;

    this.client.on('error', async (error) => {
      if (this.ended) {
        return;
      }

      this.client.end(true);
      this.client.removeAllListeners();
      this.ended = true;
      await Timers.sleep(5000);
      this.initialize(url);
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

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: RedisChannels.GUILD_SETTINGS_UPDATE, listener: (payload: RedisPayloads.GuildSettingsUpdate) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}

export default new RedisSpewer(process.env.REDIS_URL || '');
