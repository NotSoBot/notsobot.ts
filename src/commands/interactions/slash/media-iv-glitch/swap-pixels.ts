import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'swap-pixels';

export class MediaIVSwapPixelsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shuffle every pixel of an Image or Video around';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.swap_pixels.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwapPixels.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.swap_pixels.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwapPixels.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapPixels.createMessage(context, args);
  }
}
