import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fiji';

export class MediaIVFlagFijiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Fijian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.fiji.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagFiji.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.fiji.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagFiji.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagFiji.createMessage(context, args);
  }
}
