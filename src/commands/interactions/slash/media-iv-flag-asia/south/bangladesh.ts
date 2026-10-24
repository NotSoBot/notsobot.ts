import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bangladesh';

export class MediaIVFlagBangladeshCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bangladeshi flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bangladesh.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBangladesh.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bangladesh.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBangladesh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBangladesh.createMessage(context, args);
  }
}
