import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tremolo';

export class MediaAVAudioTremoloCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Modify the audio\'s wave pattern in an Audio or Video file';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioTremolo.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Modulation Frequency (Default: 5.0)', type: 'number'},
        {name: 'depth', description: 'Depth of Modulation (Default: 0.5)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioTremolo.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioTremolo.createMessage(context, args);
  }
}
