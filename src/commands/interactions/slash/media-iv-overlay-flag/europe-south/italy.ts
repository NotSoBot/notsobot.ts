import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'italy';

export class MediaIVFlagItalyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Italian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.italy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagItaly.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.italy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagItaly.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagItaly.createMessage(context, args);
  }
}
