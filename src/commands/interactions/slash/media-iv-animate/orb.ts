import { Interaction } from 'detritus-client';

import { MediaSlideDirections } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'orb';

export class MediaIVOrbCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a spinning Globe/Orb out of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.orb.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOrb.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.orb.name');

  constructor() {
    super({
      options: [
        {
          name: 'direction',
          description: 'Rotation Direction',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.orb.direction'),
          choices: Parameters.Slash.oneOf({choices: MediaSlideDirections, defaultChoice: MediaSlideDirections.RIGHT, localizationKey: 'choices.directions'}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOrb.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOrb.createMessage(context, args);
  }
}
