import { Store } from './store';


export interface GuildSettingsStored {
  id: string,
  prefixes: Array<{
    added: string,
    guild_id: string,
    prefix: string,
    user_id: string,
  }>,
}

// Stores guild settings
class GuildSettings extends Store<string, GuildSettingsStored> {
  constructor() {
    super({expire: (30 * 60) * 1000});
  }

  insert(payload: GuildSettingsStored): void {
    this.set(payload.id, payload);
  }
}

export default new GuildSettings();



export type GuildSettingsPromise = Promise<GuildSettingsStored | null>;

class GuildSettingsPromises extends Store<string, GuildSettingsPromise> {
  insert(guildId: string, promise: GuildSettingsPromise): void {
    this.set(guildId, promise);
  }
}

export const GuildSettingsPromisesStore = new GuildSettingsPromises();
