import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'haiti';

export class MediaIVFlagHaitiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Haitian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.haiti.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagHaiti.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.haiti.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagHaiti.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagHaiti.createMessage(context, args);
  }
}
