import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'rotate';

export class MediaIVToolsRotateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rotate an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.rotate.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRotate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.rotate.name');

  constructor() {
    super({
      options: [
        {name: 'crop', description: 'Crop Media', ...I18n.optionLocalizations('commands.media_iv_tools.rotate.crop'), type: Boolean},
        {name: 'degrees', description: 'Resize Amount (default: 90)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate.degrees'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRotate.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRotate.createMessage(context, args);
  }
}
