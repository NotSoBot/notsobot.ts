import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteEditorBannedUserRooms } from '../api';
import { ApiEventsSpewer } from '../apievents';
import { log } from '../log';
import { captureError } from '../sentry';

import { Listener } from './listener';


// A ban waiting for its rooms to be deleted: `queued`, then `sending` (at most `MAX_SENDING` at once), then gone, or
// back to `queued` once when the api didn't take it. The delete finds every room they made in the server, so asking
// again is safe
interface BanCleanup {
  attempt: number,
  guildId: string,
  shard: ShardClient,
  userId: string,
}

// a cleaned up raid is hundreds of bans at once, each used to be its own request right away
const MAX_SENDING = 4;
// the api client never resends a write: one dropped connection (or a restart of the api) used to leave the banned
// person's rooms up for everyone in them, with nothing saying so
const MAX_ATTEMPTS = 2;
const RETRY_DELAY = 5000;
// past this many waiting the api is down or far behind, the newest are dropped (and said so) instead of piling up
const MAX_QUEUED = 2000;


// someone banned from a server loses the media editor rooms they made in its Activity, for everyone in them
class EditorRoomsListener extends Listener {
  queued: Array<BanCleanup> = [];
  sending = 0;

  enqueue(cleanup: BanCleanup): void {
    if (MAX_QUEUED <= this.queued.length) {
      log.warn(`editor rooms of banned user ${cleanup.userId} in ${cleanup.guildId} not deleted, ${this.queued.length} bans are waiting`);
      return;
    }
    this.queued.push(cleanup);
    this.drain();
  }

  drain(): void {
    while (this.sending < MAX_SENDING && this.queued.length) {
      const cleanup = this.queued.shift()!;
      this.sending++;
      this.send(cleanup).finally(() => {
        this.sending--;
        this.drain();
      });
    }
  }

  // never throws
  async send(cleanup: BanCleanup): Promise<void> {
    const { guildId, shard, userId } = cleanup;
    try {
      await deleteEditorBannedUserRooms({client: shard}, guildId, userId);
    } catch(error: any) {
      // a 4xx is the api turning it down, it'd turn the same thing down again
      const status: number | undefined = error && error.response && error.response.statusCode;
      if ((!status || 500 <= status) && cleanup.attempt < MAX_ATTEMPTS) {
        // not awaited: the wait mustn't hold one of the slots the bans behind it are waiting for
        Timers.sleep(RETRY_DELAY).then(() => this.enqueue({...cleanup, attempt: cleanup.attempt + 1}));
        return;
      }
      log.warn(`editor rooms of banned user ${userId} in ${guildId} not deleted`, error);
      // one a minute says the api's failing them, each ban is in the log
      captureError(error, {
        extra: {guildId, userId},
        fingerprint: ['editor-rooms-ban-cleanup'],
        tags: {source: 'editor.rooms.ban'},
        throttle: 60 * 1000,
      });
    }
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_ADD, (event) => {
        const { guildId, shard, user } = event;
        if (user.bot) {
          return;
        }
        this.enqueue({attempt: 1, guildId, shard, userId: user.id});
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new EditorRoomsListener();
