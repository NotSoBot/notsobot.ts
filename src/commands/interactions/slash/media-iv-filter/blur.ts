import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'blur';

export class MediaIVBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Blur an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.blur.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.blur.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Blur Scale (Default: 2.0)', ...I18n.optionLocalizations('commands.media_iv.fun.blur.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBlur.createMessage(context, args);
  }
}
