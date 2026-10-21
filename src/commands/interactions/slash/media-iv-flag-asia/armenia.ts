import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'armenia';

export class MediaIVFlagArmeniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Armenian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.armenia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagArmenia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.armenia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagArmenia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagArmenia.createMessage(context, args);
  }
}
