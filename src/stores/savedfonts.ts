import { Command, Interaction } from 'detritus-client';

import { Store } from './store';

import { RestResponsesRaw, fetchSavedFonts } from '../api';


type SavedFontsContext = Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext;


// a server's fonts can be changed by any of its admins (or on the dashboard), so they're only kept for a bit
const EXPIRE = 5 * 60 * 1000;


// Stores the saved fonts (`/fonts`) a command can pick from: a user's own (by user id) and a guild's (`guild.<id>`),
// fetched together the first time something needs them (a `font` that isn't bundled, the font autocompletes). The bot's
// own font commands put what the api answered back in, changes from elsewhere show up once it expires
class SavedFontsStore extends Store<string, RestResponsesRaw.SavedFonts> {
  promises = new Map<string, Promise<null | RestResponsesRaw.FetchSavedFonts>>();
  // key -> bumped by every insert while a fetch for it is going, a fetch only caches what it got if nothing was inserted
  // since it started (or a font a command just saved would vanish until it expires). only kept while fetching
  versions = new Map<string, {fetches: number, version: number}>();

  constructor() {
    super({expire: EXPIRE});
  }

  startFetch(key: string): number {
    let item = this.versions.get(key);
    if (!item) {
      item = {fetches: 0, version: 0};
      this.versions.set(key, item);
    }
    item.fetches++;
    return item.version;
  }

  // if nothing was inserted for the key since `startFetch` gave out this version
  endFetch(key: string, version: number): boolean {
    const item = this.versions.get(key);
    if (!item) {
      return false;
    }
    if (!--item.fetches) {
      this.versions.delete(key);
    }
    return item.version === version;
  }

  insert(context: SavedFontsContext, fonts: RestResponsesRaw.SavedFonts, guildId?: null | string): void {
    const key = (guildId) ? `guild.${guildId}` : context.userId;
    const item = this.versions.get(key);
    if (item) {
      item.version++;
    }
    this.set(key, fonts);
  }

  async getOrFetch(context: SavedFontsContext): Promise<RestResponsesRaw.FetchSavedFonts> {
    const userKey = context.userId;
    const guildKey = (context.guildId) ? `guild.${context.guildId}` : null;
    if (this.has(userKey) && (!guildKey || this.has(guildKey))) {
      return {guild: (guildKey) ? this.get(guildKey)! : null, user: this.get(userKey)!};
    }

    const promiseKey = `${userKey}.${guildKey}`;
    let promise = this.promises.get(promiseKey);
    if (!promise) {
      const userVersion = this.startFetch(userKey);
      const guildVersion = (guildKey) ? this.startFetch(guildKey) : 0;
      promise = (async () => {
        let payload: null | RestResponsesRaw.FetchSavedFonts = null;
        try {
          payload = await fetchSavedFonts(context);
        } catch(error) {
          // a command still works with the bundled fonts
        } finally {
          this.promises.delete(promiseKey);
        }
        // cached once here instead of by every caller, and only for the keys nothing was inserted for in the meantime
        const userUnchanged = this.endFetch(userKey, userVersion);
        const guildUnchanged = !!guildKey && this.endFetch(guildKey, guildVersion);
        if (payload) {
          if (payload.user && userUnchanged) {
            this.set(userKey, payload.user);
          }
          if (guildKey && payload.guild && guildUnchanged) {
            this.set(guildKey, payload.guild);
          }
        }
        return payload;
      })();
      this.promises.set(promiseKey, promise);
    }

    const payload = await promise;
    if (payload) {
      return payload;
    }
    return {guild: (guildKey) ? this.get(guildKey) || null : null, user: this.get(userKey) || null};
  }
}

export default new SavedFontsStore();
