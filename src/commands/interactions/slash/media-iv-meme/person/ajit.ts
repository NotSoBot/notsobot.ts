import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ajit';

export class MediaIVMemeAjitPai1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put Ajit Pai and his giant Reese\'s mug in front of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.ajit.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsAjitPai1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.ajit.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsAjitPai1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsAjitPai1.createMessage(context, args);
  }
}
