import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'keepitem';

export class MediaIVMemeKeepItemCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Place an Image or Video inside of a Customers Usually Keep This Item meme';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.keep_item.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayKeepItem.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.keep_item.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayKeepItem.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayKeepItem.createMessage(context, args);
  }
}
