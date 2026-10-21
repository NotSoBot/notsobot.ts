import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'serbia';

export class MediaIVFlagSerbiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Serbian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.serbia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSerbia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.serbia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSerbia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSerbia.createMessage(context, args);
  }
}
