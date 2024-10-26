import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'recolor';

export class MediaIVRecolorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Recolor an Image or Video with brighter colors';
  metadata = {
	id: Formatter.Commands.MediaIVManipulationRecolor.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRecolor.CommandArgs) {
	return Formatter.Commands.MediaIVManipulationRecolor.createMessage(context, args);
  }
}
