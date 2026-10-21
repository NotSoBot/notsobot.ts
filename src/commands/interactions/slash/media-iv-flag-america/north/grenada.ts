import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grenada';

export class MediaIVFlagGrenadaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Grenadian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.grenada.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGrenada.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.grenada.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGrenada.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGrenada.createMessage(context, args);
  }
}
