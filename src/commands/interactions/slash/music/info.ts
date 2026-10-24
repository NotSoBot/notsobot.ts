import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicInfoCommand extends BaseInteractionCommandOption {
  description = 'Show what\'s playing';
  metadata = {
    id: Formatter.Commands.MusicInfo.COMMAND_ID,
  };
  name = 'info';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicInfo.createMessage(context);
  }
}
