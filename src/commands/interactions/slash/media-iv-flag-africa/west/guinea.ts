import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'guinea';

export class MediaIVFlagGuineaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Guinean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.guinea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGuinea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.guinea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGuinea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGuinea.createMessage(context, args);
  }
}
