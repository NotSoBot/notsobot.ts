import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicEffectClearCommand extends BaseInteractionCommandOption {
  description = 'Take every effect off the music (in the bot\'s channel with Manage Server or the DJ role)';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'clear';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicEffect.createClearMessage(context);
  }
}
