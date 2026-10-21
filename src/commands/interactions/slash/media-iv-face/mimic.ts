import { Interaction } from 'detritus-client';

import { MediaFaceFeaturesSwapModes, MediaFaceFeaturesSwapRegions } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'mimic';

export class MediaIVMimicCommand extends BaseInteractionMediasCommandOption {
  description = 'Make the first media\'s face copy the expression and head pose of the second media\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.mimic.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.mimic.name');

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: 'Relative adds the motion to the face\'s own, Absolute copies it as is (Default: Relative)',
          ...I18n.optionLocalizations('commands.media_iv_6.mood.mimic.mode'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceFeaturesSwapModes, defaultChoice: MediaFaceFeaturesSwapModes.RELATIVE}),
        },
        {
          name: 'multiplier',
          description: 'How much of the motion to copy (0..2) (Default: 1)',
          ...I18n.optionLocalizations('commands.media_iv_6.mood.mimic.multiplier'),
          maxValue: 2,
          minValue: 0,
          type: Number,
        },
        {
          name: 'regions',
          description: 'What gets copied (Default: All)',
          ...I18n.optionLocalizations('commands.media_iv_6.mood.mimic.regions'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceFeaturesSwapRegions, defaultChoice: MediaFaceFeaturesSwapRegions.ALL}),
        },
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.createMessage(context, args);
  }
}
