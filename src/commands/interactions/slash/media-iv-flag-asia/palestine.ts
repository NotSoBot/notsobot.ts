import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'palestine';

export class MediaIVFlagPalestineCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Palestinian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.palestine.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPalestine.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.palestine.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPalestine.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPalestine.createMessage(context, args);
  }
}
