import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'malta';

export class MediaIVFlagMaltaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Maltese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.malta.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMalta.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.malta.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMalta.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMalta.createMessage(context, args);
  }
}
