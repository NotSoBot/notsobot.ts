import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gambia';

export class MediaIVFlagGambiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Gambian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.gambia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGambia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.gambia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGambia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGambia.createMessage(context, args);
  }
}
