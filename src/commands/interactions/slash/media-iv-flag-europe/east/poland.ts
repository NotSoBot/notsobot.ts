import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'poland';

export class MediaIVFlagPolandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Polish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.poland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPoland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.poland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPoland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPoland.createMessage(context, args);
  }
}
