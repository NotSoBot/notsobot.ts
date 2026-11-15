import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'drcongo';

export class MediaIVFlagDRCongoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a DR Congo flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.drcongo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.drcongo.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.createMessage(context, args);
  }
}
