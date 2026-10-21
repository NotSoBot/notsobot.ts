import { Interaction } from 'detritus-client';

import { MediaWiggleDirections } from '../../../../constants';
import { Formatter, I18n, Parameters, toTitleCase } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const DEFAULT_DIRECTION = Formatter.Commands.MediaIVManipulationWiggle.DEFAULT_DIRECTION;

export const COMMAND_NAME = 'wiggle';

export class MediaIVWiggleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Wiggle an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.wiggle.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWiggle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.wiggle.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Wiggle Distortion Amount (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wiggle.amount'), type: Number},
        {
          name: 'direction',
          description: `Wave Direction (Default: ${toTitleCase(DEFAULT_DIRECTION)})`,
          ...I18n.optionLocalizations('commands.media_iv_2.fun.wiggle.direction'),
          choices: Parameters.Slash.oneOf({
            choices: MediaWiggleDirections,
            defaultChoice: DEFAULT_DIRECTION,
            localizationKey: 'choices.directions',
          }),
        },
        {name: 'wavelengths', description: 'Sinusoidal Wavelengths Amount (Default: 0.5)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wiggle.wavelengths'), type: 'number'},
        {name: 'speed', description: 'Wiggle Speed (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wiggle.speed'), type: 'number'},
        {name: 'loop', description: 'Wiggle continuously without restarting for a smooth loop (Default: False)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wiggle.loop'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWiggle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWiggle.createMessage(context, args);
  }
}
