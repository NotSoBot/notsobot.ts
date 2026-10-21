import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'keem2';

export class MediaIVMemeKeemstar2Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a picture frame held by Keemstar';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.keem2.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar2.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.keem2.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar2.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsKeemstar2.createMessage(context, args);
  }
}
