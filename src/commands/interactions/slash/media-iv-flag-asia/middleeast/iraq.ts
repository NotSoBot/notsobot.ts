import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'iraq';

export class MediaIVFlagIraqCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Iraqi flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.iraq.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIraq.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.iraq.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIraq.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIraq.createMessage(context, args);
  }
}
