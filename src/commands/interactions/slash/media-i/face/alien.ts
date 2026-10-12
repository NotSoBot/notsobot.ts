import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'alien';

export class MediaIAlienCommand extends BaseInteractionImageCommandOption {
  description = 'Alienify an Image\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_i.face.alien.description');
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceAlien.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.face.alien.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceAlien.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceAlien.createMessage(context, args);
  }
}
