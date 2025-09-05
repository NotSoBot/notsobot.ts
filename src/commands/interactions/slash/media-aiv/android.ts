import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'android';

export class MediaAIVAndroidCommand extends BaseInteractionMediaCommandOption {
  description = 'Compress the Audio/Image/Video File to be Android-Like';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAndroid.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Compression Scale (Default: 10)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAndroid.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAndroid.createMessage(context, args);
  }
}
