import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'supreme';

export class MediaIVMemeSupremeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Stamp the Supreme logo on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.supreme.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlaySupreme.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.supreme.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlaySupreme.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySupreme.createMessage(context, args);
  }
}
