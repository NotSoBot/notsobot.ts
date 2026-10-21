import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pansexual';

export class MediaIVFlagPansexualCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Pansexual pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.pansexual.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.pansexual.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.createMessage(context, args);
  }
}
