import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ethiopia';

export class MediaIVFlagEthiopiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Ethiopian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ethiopia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEthiopia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ethiopia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEthiopia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEthiopia.createMessage(context, args);
  }
}
