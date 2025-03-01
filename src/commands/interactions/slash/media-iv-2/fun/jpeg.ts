import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'jpeg';

export class MediaIVJPEGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Needs More JPEG';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationJPEG.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'notransparency', description: 'Do not keep transparency', type: Boolean},
        {name: 'quality', description: 'JPEG Quality (Default: 1)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationJPEG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationJPEG.createMessage(context, args);
  }
}
