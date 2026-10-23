import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { ApiEventsSpewer } from '../apievents';
import VoiceNode from '../voicenode';

import { Listener } from './listener';


// our own voice state and voice server go to the voice node, it only acts on guilds it's playing in
class VoiceNodeListener extends Listener {
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    VoiceNode.cluster = cluster;

    {
      // resumes the node session we had before restarting, and rejoins its players' channels per shard
      const subscription = cluster.subscribe(ClientEvents.GATEWAY_READY, (event) => {
        VoiceNode.onShardReady(event.shard);
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.VOICE_STATE_UPDATE, (event) => {
        const { shard, voiceState } = event;
        if (voiceState.userId === shard.userId && voiceState.guildId) {
          VoiceNode.handleVoiceState(voiceState.guildId, voiceState.channelId || null, voiceState.sessionId);
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.VOICE_SERVER_UPDATE, (event) => {
        if (event.guildId) {
          VoiceNode.handleVoiceServer(event.guildId, event.endpoint || null, event.token);
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new VoiceNodeListener();
