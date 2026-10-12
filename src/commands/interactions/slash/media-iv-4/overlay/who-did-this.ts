import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'whodidthis';

export class MediaIVOverlayWhoDidThisCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Place an Image or Video inside of a Who Did This meme';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.who_did_this.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.who_did_this.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.createMessage(context, args);
  }
}
