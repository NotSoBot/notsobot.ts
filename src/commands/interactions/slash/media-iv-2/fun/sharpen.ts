import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sharpen';

export class MediaIVSharpenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Sharpen an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSharpen.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Sharpen Scale (Default: 15.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSharpen.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSharpen.createMessage(context, args);
  }
}
