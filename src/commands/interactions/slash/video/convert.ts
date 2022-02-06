import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class VideoConvertCommand extends BaseInteractionVideoCommandOption {
  description = 'Convert a Video';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.VideoConvert.SLASH_CHOICES,
          default: Formatter.Commands.VideoConvert.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VideoConvert.CommandArgs) {
    return Formatter.Commands.VideoConvert.createMessage(context, args);
  }
}
