import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'china';

export class MediaIVFlagChinaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Chinese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.china.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagChina.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.china.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagChina.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagChina.createMessage(context, args);
  }
}
