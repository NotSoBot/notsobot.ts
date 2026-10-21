import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'antigua';

export class MediaIVFlagAntiguaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Antiguan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.antigua.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAntigua.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.antigua.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAntigua.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAntigua.createMessage(context, args);
  }
}
