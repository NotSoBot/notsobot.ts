import { Interaction } from 'detritus-client';

import { MediaBounceAxes, MediaBounceStyles } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'bounce';

export class MediaIVBounceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video Bounce, every frame its own size';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.bounce.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBounce.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.bounce.name');

  constructor() {
    super({
      options: [
        {
          name: 'axis',
          description: 'Which Side Bounces (Default: Height)',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.bounce.axis'),
          choices: Parameters.Slash.oneOf({choices: MediaBounceAxes, defaultChoice: MediaBounceAxes.HEIGHT, localizationKey: 'choices.media_bounce_axes'}),
        },
        {
          name: 'style',
          description: 'Bounce Style (Default: Bounce)',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.bounce.style'),
          choices: Parameters.Slash.oneOf({choices: MediaBounceStyles, defaultChoice: MediaBounceStyles.BOUNCE, localizationKey: 'choices.media_bounce_styles'}),
        },
        {name: 'bounces', description: 'Bounces per Second (0.1..10.0) (Default: 2.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.bounce.bounces'), type: 'number'},
        {name: 'minimum', description: 'Smallest Size, Percent of the Original (1..100) (Default: 5)', ...I18n.optionLocalizations('commands.media_iv_2.fun.bounce.minimum'), type: 'number'},
        {name: 'duration', description: 'Seconds, for Still Images (0.5..30.0) (Default: 3.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.bounce.duration'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBounce.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBounce.createMessage(context, args);
  }
}
