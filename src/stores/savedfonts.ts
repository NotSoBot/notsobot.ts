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

  constructor() {
    super({expire: EXPIRE});
  }

  insert(context: SavedFontsContext, fonts: RestResponsesRaw.SavedFonts, guildId?: null | string): void {
    this.set((guildId) ? `guild.${guildId}` : context.userId, fonts);
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
      promise = (async () => {
        try {
          return await fetchSavedFonts(context);
        } catch(error) {
          // a command still works with the bundled fonts
          return null;
        } finally {
          this.promises.delete(promiseKey);
        }
      })();
      this.promises.set(promiseKey, promise);
    }

    const payload = await promise;
    if (payload) {
      if (payload.user) {
        this.set(userKey, payload.user);
      }
      if (guildKey && payload.guild) {
        this.set(guildKey, payload.guild);
      }
      return payload;
    }
    return {guild: (guildKey) ? this.get(guildKey) || null : null, user: this.get(userKey) || null};
  }
}

export default new SavedFontsStore();
