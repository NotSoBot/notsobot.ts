import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'latvia';

export class MediaIVFlagLatviaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Latvian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.latvia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLatvia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.latvia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLatvia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLatvia.createMessage(context, args);
  }
}
