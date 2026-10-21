import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bulgaria';

export class MediaIVFlagBulgariaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bulgarian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bulgaria.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bulgaria.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.createMessage(context, args);
  }
}
