import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'guyana';

export class MediaIVFlagGuyanaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Guyanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.guyana.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGuyana.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.guyana.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGuyana.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGuyana.createMessage(context, args);
  }
}
