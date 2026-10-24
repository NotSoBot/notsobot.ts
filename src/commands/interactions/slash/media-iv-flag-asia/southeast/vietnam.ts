import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vietnam';

export class MediaIVFlagVietnamCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Vietnamese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.vietnam.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagVietnam.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.vietnam.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagVietnam.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVietnam.createMessage(context, args);
  }
}
