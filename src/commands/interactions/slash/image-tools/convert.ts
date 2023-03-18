import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class ImageToolsConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image';
  metadata = {
    id: Formatter.Commands.MediaIVToolsConvert.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaIVToolsConvert.SLASH_CHOICES,
          default: Formatter.Commands.MediaIVToolsConvert.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsConvert.CommandArgs) {
    return Formatter.Commands.MediaIVToolsConvert.createMessage(context, args);
  }
}
