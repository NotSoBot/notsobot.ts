import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'trim';

export class MediaIVToolsTrimCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Trim an Image or Video\'s Excess Background';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.trim.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTrim.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.trim.name');

  constructor() {
    super({
      options: [
        {name: 'margin', description: 'Trim Margins (Default: 16px)', ...I18n.optionLocalizations('commands.media_iv_tools.trim.margin'), type: Number},
        {name: 'threshold', description: 'Color Threshold (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_tools.trim.threshold'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTrim.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTrim.createMessage(context, args);
  }
}
