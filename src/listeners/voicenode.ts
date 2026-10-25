import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { ApiEventsSpewer } from '../apievents';
import { RedisChannels } from '../constants';
import VoiceNode from '../voicenode';

import { Listener } from './listener';


// a dashboard control older than this was replayed after we reconnected, it's not acted on anymore
const MUSIC_CONTROL_MAX_AGE = 15 * 1000;


// our own voice state and voice server go to the voice node, it only acts on guilds it's playing in. Everyone else's
// voice states are only counted for `pause_alone`
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
        if (!voiceState.guildId) {
          return;
        }
        if (voiceState.userId === shard.userId) {
          VoiceNode.handleVoiceState(voiceState.guildId, voiceState.channelId || null, voiceState.sessionId);
        }
        // anyone joining or leaving (us being moved too), 24/7's `pause_alone` pauses with nobody left to hear it
        VoiceNode.handleListeners(voiceState.guildId);
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

    {
      // the dashboard's pause/resume/skip/leave, every cluster gets it and only the one playing in the server acts
      const subscription = apiEvents.subscribe(RedisChannels.MUSIC_CONTROL, (payload) => {
        if (!payload || !VoiceNode.guilds.has(payload.guild_id) || MUSIC_CONTROL_MAX_AGE < Date.now() - payload.created) {
          return;
        }
        let promise: Promise<unknown>;
        switch (payload.action) {
          case 'leave': promise = Promise.resolve(VoiceNode.leave(payload.guild_id, true)); break;
          case 'pause': promise = VoiceNode.setPaused(payload.guild_id, true); break;
          // disconnected, it needs someone's channel to carry on in (`music resume` in discord)
          case 'resume': promise = VoiceNode.setPaused(payload.guild_id, false); break;
          case 'skip': promise = VoiceNode.skip(payload.guild_id); break;
          default: return;
        }
        promise.catch((error) => console.warn(`voice node dashboard ${payload.action} ${payload.guild_id}`, error));
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new VoiceNodeListener();
