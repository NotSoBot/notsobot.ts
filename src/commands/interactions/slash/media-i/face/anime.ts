import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'anime';

export class MediaIAnimeCommand extends BaseInteractionImageCommandOption {
  description = 'Animeify an Image\'s face';
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceAnime.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceAnime.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceAnime.createMessage(context, args);
  }
}
