import { Interaction } from 'detritus-client';

import { MediaMitosisDirections, MediaMitosisStyles } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'mitosis';

export class MediaIVMitosisCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video Stretch and Split in Two';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.mitosis.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMitosis.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.mitosis.name');

  constructor() {
    super({
      options: [
        {
          name: 'direction',
          description: 'Which Way it Splits, Again the Other Way Makes Four (Default: Horizontal)',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.mitosis.direction'),
          choices: Parameters.Slash.oneOf({choices: MediaMitosisDirections, defaultChoice: MediaMitosisDirections.HORIZONTAL, localizationKey: 'choices.media_mitosis_directions'}),
        },
        {
          name: 'style',
          description: 'How it Ends (Default: Split)',
          ...I18n.optionLocalizations('commands.media_iv_2.fun.mitosis.style'),
          choices: Parameters.Slash.oneOf({choices: MediaMitosisStyles, defaultChoice: MediaMitosisStyles.SPLIT, localizationKey: 'choices.media_mitosis_styles'}),
        },
        {name: 'duration', description: 'Seconds the Split Takes (0.5..30.0) (Default: 3.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.mitosis.duration'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMitosis.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMitosis.createMessage(context, args);
  }
}
