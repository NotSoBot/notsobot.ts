import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ascii-from-image';

export class AsciiFromImageCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image to ASCII Text';
  descriptionLocalizations = I18n.localizations('commands.fun.ascii_from_image.description');
  metadata = {
    id: Formatter.Commands.FunAsciiFromImage.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.ascii_from_image.name');

  constructor() {
    super({
      options: [
        {
          name: 'mobile',
          description: 'Adjust Size for Mobile Devices',
          ...I18n.optionLocalizations('commands.fun.ascii_from_image.mobile'),
          type: Boolean,
        },
        {
          name: 'size',
          description: 'Ascii Size (1..15) (Default: 15)',
          ...I18n.optionLocalizations('commands.fun.ascii_from_image.size'),
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAsciiFromImage.CommandArgs) {
    return Formatter.Commands.FunAsciiFromImage.createMessage(context, args);
  }
}
