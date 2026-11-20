import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicListenCommand extends BaseInteractionCommandOption {
  description = 'Find a song playing in voice (near your mic, or another bot\'s music), it listens for up to 2 minutes';
  metadata = {
    id: Formatter.Commands.MusicListen.COMMAND_ID,
  };
  name = 'listen';

  constructor() {
    super({
      options: [
        {
          name: 'target',
          description: 'Who to listen to: someone in your voice channel (me: what I\'m playing), everyone if left out',
          value: Formatter.Commands.MusicListen.parseTarget,
          onAutoComplete: Formatter.Commands.MusicListen.autocompleteTarget,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicListen.CommandArgs) {
    return Formatter.Commands.MusicListen.createMessage(context, args);
  }
}
