import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'knight';

export class MediaIVKnightCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video\'s face on a knight with a sword';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.knight.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceKnight.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.knight.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceKnight.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceKnight.createMessage(context, args);
  }
}
