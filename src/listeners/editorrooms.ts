import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { deleteEditorBannedUserRooms } from '../api';
import { ApiEventsSpewer } from '../apievents';

import { Listener } from './listener';


// someone banned from a server loses the media editor rooms they made in its Activity, for everyone in them
class EditorRoomsListener extends Listener {
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_ADD, async (event) => {
        const { guildId, shard, user } = event;
        if (user.bot) {
          return;
        }
        try {
          await deleteEditorBannedUserRooms({client: shard}, guildId, user.id);
        } catch(e) {

        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new EditorRoomsListener();
