import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'romania';

export class MediaIVFlagRomaniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Romanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.romania.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagRomania.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.romania.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagRomania.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagRomania.createMessage(context, args);
  }
}
