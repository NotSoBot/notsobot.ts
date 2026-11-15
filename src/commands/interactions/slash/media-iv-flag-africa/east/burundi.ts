import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'burundi';

export class MediaIVFlagBurundiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Burundian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.burundi.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBurundi.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.burundi.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBurundi.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBurundi.createMessage(context, args);
  }
}
