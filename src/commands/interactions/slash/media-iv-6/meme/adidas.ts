import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'adidas';

export class MediaIVMemeAdidasCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay the Adidas logo on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.adidas.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayAdidas.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.adidas.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayAdidas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayAdidas.createMessage(context, args);
  }
}
