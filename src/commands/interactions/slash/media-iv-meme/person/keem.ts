import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'keem';

export class MediaIVMemeKeemstar1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a slot machine Keemstar is pointing at';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.keem.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.keem.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar1.createMessage(context, args);
  }
}
