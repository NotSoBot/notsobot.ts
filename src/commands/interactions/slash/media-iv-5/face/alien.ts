import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'alien';

export class MediaIVAlienCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Alienify an Image or Video\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.alien.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceAlien.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.alien.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceAlien.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAlien.createMessage(context, args);
  }
}
