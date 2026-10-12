import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pixelate';

export class MediaIVPixelateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Pixelate an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.pixelate.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.pixelate.name');

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Size of each pixel', ...I18n.optionLocalizations('commands.media_iv.fun.pixelate.width'), type: Number},
        {name: 'nolines', description: 'Do not the pixel lines (Default: False)', ...I18n.optionLocalizations('commands.media_iv.fun.pixelate.nolines'), label: 'noLines', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPixelate.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelate.createMessage(context, args);
  }
}
