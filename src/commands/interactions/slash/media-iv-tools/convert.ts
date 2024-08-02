import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class ImageToolsConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.IMAGE.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.IMAGE.SLASH_CHOICES,
          default: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.IMAGE.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsConvert.createMessage(context, args);
  }
}
