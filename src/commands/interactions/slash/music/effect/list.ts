import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicEffectListCommand extends BaseInteractionCommandOption {
  description = 'See every effect, what it does and which are on';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicEffect.createListMessage(context);
  }
}
