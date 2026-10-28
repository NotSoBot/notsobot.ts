import { Interaction } from 'detritus-client';

import {
  MediaVegasTimecodeHorizontal,
  MediaVegasTimecodeTypes,
  MediaVegasTimecodeTypesToText,
  MediaVegasTimecodeVertical,
} from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vegas-timecode';

export class MediaIVVegasTimecodeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Burn an Image or Video\'s running time onto it, like VEGAS\' Timecode';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.vegas_timecode.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTimecodeVegas.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.vegas_timecode.name');

  constructor() {
    super({
      options: [
        {
          name: 'x',
          description: 'Where It Sits Across (Default: Right)',
          ...I18n.optionLocalizations('commands.media_iv_text.vegas_timecode.x'),
          choices: Parameters.Slash.oneOf({choices: MediaVegasTimecodeHorizontal, defaultChoice: MediaVegasTimecodeHorizontal.RIGHT}),
        },
        {
          name: 'y',
          description: 'Where It Sits Down (Default: Bottom)',
          ...I18n.optionLocalizations('commands.media_iv_text.vegas_timecode.y'),
          choices: Parameters.Slash.oneOf({choices: MediaVegasTimecodeVertical, defaultChoice: MediaVegasTimecodeVertical.BOTTOM}),
        },
        {
          name: 'type',
          description: 'How the Time Is Written (Default: SMPTE Drop)',
          ...I18n.optionLocalizations('commands.media_iv_text.vegas_timecode.type'),
          choices: Parameters.Slash.oneOf({
            choices: MediaVegasTimecodeTypes,
            defaultChoice: MediaVegasTimecodeTypes.DROP,
            descriptions: MediaVegasTimecodeTypesToText,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTimecodeVegas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTimecodeVegas.createMessage(context, args);
  }
}
