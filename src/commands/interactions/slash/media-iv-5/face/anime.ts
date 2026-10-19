import { Interaction } from 'detritus-client';

import { MediaFaceAnimeEyes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_EYES = Formatter.Commands.MediaIVManipulationFaceAnime.DEFAULT_EYES;

export const COMMAND_NAME = 'anime';

export class MediaIVAnimeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Animeify an Image or Video\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.anime.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceAnime.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'eyes',
          description: `Eye Color (Default: ${DEFAULT_EYES})`,
          ...I18n.optionLocalizations('commands.media_iv_5.face.anime.eyes'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceAnimeEyes, defaultChoice: DEFAULT_EYES}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceAnime.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAnime.createMessage(context, args);
  }
}
