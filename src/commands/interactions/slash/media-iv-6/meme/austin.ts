import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'austin';

export class MediaIVMemeAustinEvans1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a laptop presented by Austin Evans';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.austin.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsAustinEvans1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.austin.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsAustinEvans1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsAustinEvans1.createMessage(context, args);
  }
}
