import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reverb';

export class MediaAVAudioReverbCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add an Audio Reverb to an Audio or Video file';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioReverb.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'decay', description: 'Reverb Decay (Default: 0.88)', type: 'number'},
        {name: 'delay', description: 'Reverb Delay (Default: 60 ms)', type: Number},
        {name: 'volume', description: 'Reverb Volume (Default: 0.4)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioReverb.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioReverb.createMessage(context, args);
  }
}
