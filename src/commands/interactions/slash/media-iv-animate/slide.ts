import { Interaction } from 'detritus-client';

import { MediaSlideDirections } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'slide';

export class MediaIVSlideCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Scroll an Image or Video in a loop, wrapping around the edges';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.slide.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSlide.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.slide.name');

  constructor() {
    super({
      options: [
        {
          name: 'direction',
          description: 'Slide Direction',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.slide.direction'),
          choices: Parameters.Slash.oneOf({choices: MediaSlideDirections, defaultChoice: MediaSlideDirections.RIGHT, localizationKey: 'choices.directions'}),
        },
        {name: 'speed', description: 'Slide Speed (0.01..10.0) (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.slide.speed'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSlide.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSlide.createMessage(context, args);
  }
}
