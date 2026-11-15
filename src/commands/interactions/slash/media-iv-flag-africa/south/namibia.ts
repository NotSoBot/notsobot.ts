import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'namibia';

export class MediaIVFlagNamibiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Namibian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.namibia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNamibia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.namibia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNamibia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNamibia.createMessage(context, args);
  }
}
