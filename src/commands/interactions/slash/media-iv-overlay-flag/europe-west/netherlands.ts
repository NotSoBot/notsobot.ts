import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'netherlands';

export class MediaIVFlagNetherlandsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Dutch flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.netherlands.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.netherlands.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.createMessage(context, args);
  }
}
