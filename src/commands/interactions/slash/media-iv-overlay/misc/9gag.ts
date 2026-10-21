import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = '9gag';

export class MediaIVMeme9GagCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a "via 9GAG.com" watermark to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.9gag.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlay9Gag.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.9gag.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlay9Gag.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlay9Gag.createMessage(context, args);
  }
}
