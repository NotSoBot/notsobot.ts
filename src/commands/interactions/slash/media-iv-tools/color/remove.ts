import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


const { DEFAULT_THRESHOLD, MAX_THRESHOLD, MIN_THRESHOLD } = Formatter.Commands.MediaIVManipulationColorRemove;

export const COMMAND_NAME = 'remove';

export class MediaIVToolsColorRemoveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make a color in an Image or Video transparent';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.color.remove.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationColorRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.color.remove.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'Hex, RGB, HSL or a color name (Default: the most used color)',
          ...I18n.optionLocalizations('commands.media_iv_tools.color.remove.color'),
        },
        {
          name: 'threshold',
          description: `How close a color has to be to get removed, ${MIN_THRESHOLD} to ${MAX_THRESHOLD}% (Default: ${DEFAULT_THRESHOLD})`,
          ...I18n.optionLocalizations('commands.media_iv_tools.color.remove.threshold'),
          maxValue: MAX_THRESHOLD,
          minValue: MIN_THRESHOLD,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationColorRemove.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationColorRemove.createMessage(context, args);
  }
}
