import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'switzerland';

export class MediaIVFlagSwitzerlandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Swiss flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.switzerland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.switzerland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.createMessage(context, args);
  }
}
