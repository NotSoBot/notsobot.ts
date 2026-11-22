import { Command, Interaction } from 'detritus-client';

import { Store } from './store';

import { RestResponsesRaw, fetchSavedFonts } from '../api';
import { FetchVersions } from '../utils/fetchversions';


type SavedFontsContext = Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext;


// a server's fonts can be changed by any of its admins (or on the dashboard), so they're only kept for a bit
const EXPIRE = 5 * 60 * 1000;


// Stores the saved fonts (`/fonts`) a command can pick from: a user's own (by user id) and a guild's (`guild.<id>`),
// fetched together the first time something needs them (a `font` that isn't bundled, the font autocompletes). The bot's
// own font commands put what the api answered back in, changes from elsewhere show up once it expires
class SavedFontsStore extends Store<string, RestResponsesRaw.SavedFonts> {
  promises = new Map<string, Promise<null | RestResponsesRaw.FetchSavedFonts>>();
  // a fetch only caches what it got for a key if nothing was inserted for it since it started (or a font a command just
  // saved would vanish until it expires)
  fetches = new FetchVersions<string>();

  constructor() {
    super({expire: EXPIRE});
  }

  insert(context: SavedFontsContext, fonts: RestResponsesRaw.SavedFonts, guildId?: null | string): void {
    const key = (guildId) ? `guild.${guildId}` : context.userId;
    this.fetches.bump(key);
    this.set(key, fonts);
  }

  // without `get()`'s touch: no api event says a list changed (the dashboard, another cluster), only expiring does, and
  // font autocomplete reading it on every keystroke kept it from ever expiring
  peek(key: string): RestResponsesRaw.SavedFonts | undefined {
    return (this.has(key)) ? this.cache.get(key) : undefined;
  }

  async getOrFetch(context: SavedFontsContext): Promise<RestResponsesRaw.FetchSavedFonts> {
    const userKey = context.userId;
    const guildKey = (context.guildId) ? `guild.${context.guildId}` : null;
    if (this.has(userKey) && (!guildKey || this.has(guildKey))) {
      return {guild: (guildKey) ? this.peek(guildKey) || null : null, user: this.peek(userKey)!};
    }

    const promiseKey = `${userKey}.${guildKey}`;
    let promise = this.promises.get(promiseKey);
    if (!promise) {
      const userVersion = this.fetches.start(userKey);
      const guildVersion = (guildKey) ? this.fetches.start(guildKey) : 0;
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
        const userUnchanged = this.fetches.end(userKey, userVersion);
        const guildUnchanged = !!guildKey && this.fetches.end(guildKey, guildVersion);
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
    return {guild: (guildKey) ? this.peek(guildKey) || null : null, user: this.peek(userKey) || null};
  }
}

export default new SavedFontsStore();
