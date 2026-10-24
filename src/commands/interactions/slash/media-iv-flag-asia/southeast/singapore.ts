import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'singapore';

export class MediaIVFlagSingaporeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Singaporean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.singapore.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSingapore.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.singapore.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSingapore.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSingapore.createMessage(context, args);
  }
}
