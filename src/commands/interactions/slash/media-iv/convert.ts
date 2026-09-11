import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class MediaIVConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image or Video File';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.IV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.IV.SLASH_CHOICES,
        },
        {
          name: 'noaudio',
          description: 'Remove Audio',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConvert.createMessage(context, args);
  }
}
