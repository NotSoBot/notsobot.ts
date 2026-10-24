import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'srilanka';

export class MediaIVFlagSriLankaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Sri Lankan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.srilanka.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSriLanka.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.srilanka.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSriLanka.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSriLanka.createMessage(context, args);
  }
}
