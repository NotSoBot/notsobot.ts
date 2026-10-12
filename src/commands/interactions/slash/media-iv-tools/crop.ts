import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop';

export class MediaIVToolsCropCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.crop.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCrop.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.crop.name');

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Crop Width', ...I18n.optionLocalizations('commands.media_iv_tools.crop.width'), required: true},
        {name: 'height', description: 'Crop Height', ...I18n.optionLocalizations('commands.media_iv_tools.crop.height'), required: true},
        {name: 'x', description: 'Crop X Position', ...I18n.optionLocalizations('commands.media_iv_tools.crop.x')},
        {name: 'y', description: 'Crop Y Position', ...I18n.optionLocalizations('commands.media_iv_tools.crop.y')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCrop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCrop.createMessage(context, args);
  }
}
