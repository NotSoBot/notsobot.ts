import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'goldstar';

export class MediaIVMemeGoldStarCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a gold star on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.goldstar.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayGoldStar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.goldstar.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayGoldStar.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayGoldStar.createMessage(context, args);
  }
}
