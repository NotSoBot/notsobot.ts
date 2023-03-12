import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class AudioConvertCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Convert an Audio or Video File';
  metadata = {
    id: Formatter.Commands.MediaAToolsConvert.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.MediaAToolsConvert.SLASH_CHOICES,
          default: Formatter.Commands.MediaAToolsConvert.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAToolsConvert.CommandArgs) {
    return Formatter.Commands.MediaAToolsConvert.createMessage(context, args);
  }
}
