import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'identify';

export class AudioIdentifyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Identify a song in an audio or video file';
  metadata = {
    id: Formatter.Commands.MediaAVToolsIdentify.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'start',
          description: 'Starting Timestamp',
          value: Parameters.secondsWithOptions({negatives: true}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsIdentify.CommandArgs) {
    return Formatter.Commands.MediaAVToolsIdentify.createMessage(context, args);
  }
}
