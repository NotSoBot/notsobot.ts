import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glow';

export class MediaIVGlowCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a soft glow to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlow.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Glow Blur Amount', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlow.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlow.createMessage(context, args);
  }
}
