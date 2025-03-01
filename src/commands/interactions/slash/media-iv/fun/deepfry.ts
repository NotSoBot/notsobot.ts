import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'deepfry';

export class MediaIVDeepfryCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Deepfry an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDeepfry.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'notransparency', description: 'Do not keep transparency', type: Boolean},
        {name: 'scale', description: 'Deepfry Scale (Default: 10.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDeepfry.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDeepfry.createMessage(context, args);
  }
}
