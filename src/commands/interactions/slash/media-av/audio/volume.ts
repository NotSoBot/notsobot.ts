import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'volume';

export class MediaAVAudioVolumeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Manipulate an Audio or Video\'s Volume';
  metadata = {
  id: Formatter.Commands.MediaAVManipulationAudioVolume.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'volume', description: 'Volume Scale (Default: 2.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVolume.CommandArgs) {
  return Formatter.Commands.MediaAVManipulationAudioVolume.createMessage(context, args);
  }
}
