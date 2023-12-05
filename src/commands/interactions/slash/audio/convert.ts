import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class AudioConvertCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Convert an Audio or Video File';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.AUDIO.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.AUDIO.SLASH_CHOICES,
          default: Formatter.Commands.MediaAIVToolsConvert.SLASH_PARAMETERS.AUDIO.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsConvert.createMessage(context, args);
  }
}
