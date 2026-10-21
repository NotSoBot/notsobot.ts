import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'idubbbz';

export class MediaIVMemeIDubbbz1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a canvas being painted by iDubbbz';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.idubbbz.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.idubbbz.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.createMessage(context, args);
  }
}
