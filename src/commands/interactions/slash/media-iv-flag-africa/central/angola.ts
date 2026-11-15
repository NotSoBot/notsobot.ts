import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'angola';

export class MediaIVFlagAngolaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Angolan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.angola.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAngola.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.angola.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAngola.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAngola.createMessage(context, args);
  }
}
