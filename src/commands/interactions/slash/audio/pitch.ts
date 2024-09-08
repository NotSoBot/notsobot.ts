import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pitch';

export class AudioPitchCommand extends BaseInteractionVideoCommandOption {
  description = 'Manipulate an audio or video file\'s pitch';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioPitch.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Pitch Scale (Default: 2.0)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioPitch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPitch.createMessage(context, args);
  }
}
