import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicSeekCommand extends BaseInteractionCommandOption {
  description = 'Jump to a timestamp in the song';
  metadata = {
    id: Formatter.Commands.MusicSeek.COMMAND_ID,
  };
  name = 'seek';

  constructor() {
    super({
      options: [
        {name: 'position', description: 'Where to jump to, like 1:30 or 90', required: true, value: Parameters.secondsWithOptions()},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicSeek.CommandArgs) {
    return Formatter.Commands.MusicSeek.createMessage(context, args);
  }
}
