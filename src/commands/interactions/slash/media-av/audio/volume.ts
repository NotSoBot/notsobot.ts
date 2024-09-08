import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'volume';

export class MediaAVVolumeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Manipulate an Audio or Video\'s Volume';
  metadata = {
  id: Formatter.Commands.MediaAVManipulationVolume.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'volume', description: 'Volume Scale (Default: 2.0)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationVolume.CommandArgs) {
  return Formatter.Commands.MediaAVManipulationVolume.createMessage(context, args);
  }
}
