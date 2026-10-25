import { Interaction } from 'detritus-client';

import { MediaBackgroundRemovalModels, MediaBackgroundRemovalModelsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'dance';

export class MediaIVDanceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make whatever\'s in an Image or Video dance, squashing and stretching to a beat';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.animate.dance.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDance.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.animate.dance.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'How much it squashes and stretches (1..60) (Default: 20)', ...I18n.optionLocalizations('commands.media_iv_5.animate.dance.amount'), type: Number},
        {name: 'bpm', description: 'Beats per minute, a pose a beat (30..300) (Default: 120)', ...I18n.optionLocalizations('commands.media_iv_5.animate.dance.bpm'), type: Number},
        {
          name: 'model',
          description: 'Background Removal Model that finds what dances',
          ...I18n.optionLocalizations('commands.media_iv_5.animate.dance.model'),
          choices: Parameters.Slash.oneOf({
            choices: MediaBackgroundRemovalModels,
            defaultChoice: Formatter.Commands.MediaIVManipulationBackgroundRemove.DEFAULT_MODEL,
            descriptions: MediaBackgroundRemovalModelsToText,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDance.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDance.createMessage(context, args);
  }
}
