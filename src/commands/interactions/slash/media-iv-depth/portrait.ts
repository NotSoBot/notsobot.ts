import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';
import { FOCUS_OPTIONS } from './options';


export const COMMAND_NAME = 'portrait';

export class MediaIVDepthPortraitCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Portrait mode: blur the background and foreground by depth, keeping the subject sharp';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.portrait.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDepthBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_depth.portrait.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'The most blur, a percent of the shorter side, 0.1 to 10 (Default: 2.5)',
          ...I18n.optionLocalizations('commands.media_iv_depth.portrait.amount'),
          maxValue: 10,
          minValue: 0.1,
          type: 'number',
        },
        {
          name: 'range',
          description: 'How much depth around the focus stays sharp, 0 to 1 (Default: 0.15)',
          ...I18n.optionLocalizations('commands.media_iv_depth.portrait.range'),
          maxValue: 1,
          minValue: 0,
          type: 'number',
        },
        ...FOCUS_OPTIONS,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDepthBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthBlur.createMessage(context, args);
  }
}
