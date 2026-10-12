import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sharpen';

export class MediaIVSharpenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Sharpen an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.sharpen.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSharpen.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.sharpen.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Sharpen Scale (Default: 15.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.sharpen.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSharpen.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSharpen.createMessage(context, args);
  }
}
