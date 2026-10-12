import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clown';

export class MediaIClownCommand extends BaseInteractionImageCommandOption {
  description = 'Clownify an Image\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_i.face.clown.description');
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceClown.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.face.clown.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceClown.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceClown.createMessage(context, args);
  }
}
