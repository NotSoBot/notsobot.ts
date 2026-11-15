import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'malawi';

export class MediaIVFlagMalawiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Malawian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.malawi.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMalawi.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.malawi.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMalawi.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMalawi.createMessage(context, args);
  }
}
