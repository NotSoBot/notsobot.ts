import { Interaction } from 'detritus-client';

import { MediaPixelSortFunctions, MediaPixelSortIntervals } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pixel-sort';

export class MediaIVPixelSortCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Sort runs of pixels in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.pixel_sort.description');
  metadata = {
    credits: Formatter.Commands.MediaIVManipulationPixelSort.CREDITS,
    id: Formatter.Commands.MediaIVManipulationPixelSort.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.pixel_sort.name');

  constructor() {
    super({
      options: [
        {
          name: 'interval',
          description: 'Where sorted runs break',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.interval'),
          choices: Parameters.Slash.oneOf({choices: MediaPixelSortIntervals, defaultChoice: MediaPixelSortIntervals.THRESHOLD}),
        },
        {
          name: 'sort',
          description: 'What to sort the pixels by',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.sort'),
          choices: Parameters.Slash.oneOf({choices: MediaPixelSortFunctions, defaultChoice: MediaPixelSortFunctions.LIGHTNESS}),
        },
        {name: 'angle', description: 'Sorting Angle (0..359) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.angle'), type: Number},
        {name: 'lower', description: 'Lower Threshold (0..1) (Default: 0.25)', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.lower'), type: 'number'},
        {name: 'upper', description: 'Upper Threshold (0..1) (Default: 0.8)', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.upper'), type: 'number'},
        {name: 'length', description: 'Run Length for random/waves intervals (2..1000) (Default: 50)', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.length'), type: Number},
        {name: 'randomness', description: 'Percentage of runs left unsorted (0..100) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.randomness'), type: Number},
        {name: 'reverse', description: 'Sort in reverse order', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.reverse'), type: Boolean},
        {name: 'seed', description: 'Random Seed, reuse it to get the same result', ...I18n.optionLocalizations('commands.media_iv_3.fun.pixel_sort.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPixelSort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelSort.createMessage(context, args);
  }
}
