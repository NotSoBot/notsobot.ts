import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class AudioConvertCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Convert an Audio or Video File';
  metadata = {
    id: Formatter.Commands.AudioConvert.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          choices: Formatter.Commands.AudioConvert.SLASH_CHOICES,
          default: Formatter.Commands.AudioConvert.DEFAULT_MIMETYPE,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.AudioConvert.CommandArgs) {
    return Formatter.Commands.AudioConvert.createMessage(context, args);
  }
}
