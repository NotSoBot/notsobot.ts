import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'stock';

export class MediaIVMemeShutterstockCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a Shutterstock watermark to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.stock.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayShutterstock.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.stock.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayShutterstock.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayShutterstock.createMessage(context, args);
  }
}
