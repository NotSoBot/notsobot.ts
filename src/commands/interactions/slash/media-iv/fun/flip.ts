import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flip';

export class MediaIVFlipCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flip an Image or Video (Vertical Flip)';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.flip.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlip.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.flip.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlip.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlip.createMessage(context, args);
  }
}
