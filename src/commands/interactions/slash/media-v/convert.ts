import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class VideoConvertCommand extends BaseInteractionVideoCommandOption {
  description = 'Convert a Video';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.VIDEO.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.VIDEO.SLASH_CHOICES,
          default: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.VIDEO.DEFAULT_MIMETYPE,
        },
        {
          name: 'noaudio',
          description: 'Remove Audio',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsConvert.createMessage(context, args);
  }
}
