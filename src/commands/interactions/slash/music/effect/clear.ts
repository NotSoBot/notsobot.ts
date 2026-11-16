import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicEffectClearCommand extends BaseInteractionCommandOption {
  description = 'Take every effect off the music (in the bot\'s channel, a DJ with DJ mode on)';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'clear';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicEffect.createClearMessage(context);
  }
}
