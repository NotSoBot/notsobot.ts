import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bandicam';

export class MediaIVMemeBandicamCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a Bandicam watermark to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.bandicam.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayBandicam.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.bandicam.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayBandicam.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayBandicam.createMessage(context, args);
  }
}
