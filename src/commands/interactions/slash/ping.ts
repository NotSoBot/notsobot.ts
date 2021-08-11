import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';


export default {
  description: 'ping test!',
  name: 'ping',
  run: (context: Interaction.InteractionContext) => {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'pong!');
  },
};
