import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'myanmar';

export class MediaIVFlagMyanmarCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Myanmar flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.myanmar.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMyanmar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.myanmar.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMyanmar.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMyanmar.createMessage(context, args);
  }
}
