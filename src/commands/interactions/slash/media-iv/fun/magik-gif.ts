import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'magik-gif';

export class MediaIVMagikGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Magikfy an Image or Video, Single-framed Images become Animated';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.magik_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMagikAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'boomerang', description: 'Play the zoom back out at the end', ...I18n.optionLocalizations('commands.media_iv.fun.magik_gif.boomerang'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMagikAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagikAnimated.createMessage(context, args);
  }
}
