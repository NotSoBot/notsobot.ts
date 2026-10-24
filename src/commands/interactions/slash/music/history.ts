import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicHistoryCommand extends BaseInteractionCommandOption {
  description = 'See what played recently';
  metadata = {
    id: Formatter.Commands.MusicHistory.COMMAND_ID,
  };
  name = 'history';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicHistory.createMessage(context);
  }
}
