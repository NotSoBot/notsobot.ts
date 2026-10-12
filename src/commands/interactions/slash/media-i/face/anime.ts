import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'anime';

export class MediaIAnimeCommand extends BaseInteractionImageCommandOption {
  description = 'Animeify an Image\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_i.face.anime.description');
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceAnime.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceAnime.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceAnime.createMessage(context, args);
  }
}
