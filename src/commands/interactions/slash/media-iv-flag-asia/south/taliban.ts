import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'taliban';

export class MediaIVFlagTalibanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay the Taliban flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.taliban.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTaliban.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.taliban.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTaliban.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTaliban.createMessage(context, args);
  }
}
