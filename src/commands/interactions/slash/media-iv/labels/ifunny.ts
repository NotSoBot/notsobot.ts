import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ifunny';

export class MediaIVLabelsIFunnyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach an iFunny Label on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsIFunny.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsIFunny.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsIFunny.createMessage(context, args);
  }
}
