import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tunisia';

export class MediaIVFlagTunisiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Tunisian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.tunisia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTunisia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.tunisia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTunisia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTunisia.createMessage(context, args);
  }
}
