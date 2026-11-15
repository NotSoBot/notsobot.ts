import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'niger';

export class MediaIVFlagNigerCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Nigerien flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.niger.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNiger.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.niger.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNiger.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNiger.createMessage(context, args);
  }
}
