import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'uncaption';

export class MediaIVToolsUncaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Remove the caption from an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.uncaption.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationUncaption.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.uncaption.name');

  constructor() {
    super({
      options: [
        {name: 'tolerance', description: 'White Color Tolerance (0..255) (Default: 35)', ...I18n.optionLocalizations('commands.media_iv_tools.uncaption.tolerance'), maxValue: 255, minValue: 0, type: ApplicationCommandOptionTypes.INTEGER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationUncaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUncaption.createMessage(context, args);
  }
}
