import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pitch';

export class MediaAVAudioPitchCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Manipulate an Audio or Video\'s Pitch';
  metadata = {
	id: Formatter.Commands.MediaAVManipulationAudioPitch.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Pitch Scale (Default: 2.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioPitch.CommandArgs) {
	return Formatter.Commands.MediaAVManipulationAudioPitch.createMessage(context, args);
  }
}
