import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'dork';

export class MediaIVMemeDorkCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a sign held by Kevin from Ed, Edd n Eddy';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.dork.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayDork.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.dork.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayDork.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayDork.createMessage(context, args);
  }
}
