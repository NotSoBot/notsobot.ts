import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'colombia';

export class MediaIVFlagColombiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Colombian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.colombia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagColombia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.colombia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagColombia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagColombia.createMessage(context, args);
  }
}
