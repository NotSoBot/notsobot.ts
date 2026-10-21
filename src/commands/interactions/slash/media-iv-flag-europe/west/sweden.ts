import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sweden';

export class MediaIVFlagSwedenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Swedish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.sweden.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSweden.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.sweden.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSweden.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSweden.createMessage(context, args);
  }
}
