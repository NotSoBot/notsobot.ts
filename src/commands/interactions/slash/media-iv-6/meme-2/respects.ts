import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'respects';

export class MediaIVMemeRespectsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video in the funeral portrait, press F to pay respects';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.respects.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayRespects.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.respects.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayRespects.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayRespects.createMessage(context, args);
  }
}
