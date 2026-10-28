import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'swap-rgba';

export class MediaIVSwapRGBACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swap an Image or Video\'s RGBA channels around';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.swap_rgba.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwapRGBA.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.swap_rgba.name');

  constructor() {
    super({
      options: [
        {name: 'channels', description: 'RGBA Channels', ...I18n.optionLocalizations('commands.media_iv.fun.swap_rgba.channels'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwapRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapRGBA.createMessage(context, args);
  }
}
