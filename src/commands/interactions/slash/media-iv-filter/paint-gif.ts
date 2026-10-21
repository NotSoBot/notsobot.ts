import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'paint-gif';

export class MediaIVPaintGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a gradually increasing Oil Paint effect to a Single-framed Image';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.paint_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaintAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.paint_gif.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaintAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaintAnimated.createMessage(context, args);
  }
}
