import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'yusuke';

export class MediaIVMemeYusukeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on Yusuke\'s painting from Persona 5';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.yusuke.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayYusuke.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.yusuke.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayYusuke.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayYusuke.createMessage(context, args);
  }
}
