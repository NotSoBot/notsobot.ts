import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class MediaAVToolsConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Audio or Video File';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.AV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.AV.SLASH_CHOICES,
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
