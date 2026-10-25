import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hidden';

export class MediaIVHiddenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Hide an Image or Video in a checkerboard, it shows when you step back or squint';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hidden.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHidden.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.hidden.name');

  constructor() {
    super({
      options: [
        {name: 'share', description: 'How much of the media shows through (1..50) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hidden.share'), type: Number},
        {name: 'size', description: 'Checker square size in pixels (1..10) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hidden.size'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHidden.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHidden.createMessage(context, args);
  }
}
