import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'panama';

export class MediaIVFlagPanamaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Panamanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.panama.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPanama.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.panama.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPanama.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPanama.createMessage(context, args);
  }
}
