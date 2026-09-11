import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'concat';

export class MediaAIVConcatCommand extends BaseInteractionMediasCommandOption {
  description = 'Concat two Medias together';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConcat.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({minAmount: 2});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConcat.createMessage(context, args);
  }
}
