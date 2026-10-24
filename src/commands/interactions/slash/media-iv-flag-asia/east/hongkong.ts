import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hongkong';

export class MediaIVFlagHongKongCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Hong Kong flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.hongkong.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.hongkong.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.createMessage(context, args);
  }
}
