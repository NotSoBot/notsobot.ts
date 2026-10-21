import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'estonia';

export class MediaIVFlagEstoniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Estonian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.estonia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEstonia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.estonia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEstonia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEstonia.createMessage(context, args);
  }
}
