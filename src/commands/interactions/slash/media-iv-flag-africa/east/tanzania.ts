import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tanzania';

export class MediaIVFlagTanzaniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Tanzanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.tanzania.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTanzania.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.tanzania.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTanzania.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTanzania.createMessage(context, args);
  }
}
