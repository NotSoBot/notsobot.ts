import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'jpeg';

export class MediaIVJPEGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Needs More JPEG';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.jpeg.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationJPEG.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'notransparency', description: 'Do not keep transparency', ...I18n.optionLocalizations('commands.media_iv_2.fun.jpeg.notransparency'), type: Boolean},
        {name: 'quality', description: 'JPEG Quality (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.jpeg.quality'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationJPEG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationJPEG.createMessage(context, args);
  }
}
