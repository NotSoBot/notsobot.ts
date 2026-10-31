import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ascii';

export class MediaIVAsciiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Ascii-fy an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.ascii.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationASCII.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'invert', description: 'Invert the Colors', ...I18n.optionLocalizations('commands.media_iv.fun.ascii.invert'), type: Boolean},
        {name: 'zoom', description: 'Shrink the Frame First for Bigger Characters (Default: False)', ...I18n.optionLocalizations('commands.media_iv.fun.ascii.zoom'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationASCII.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationASCII.createMessage(context, args);
  }
}
