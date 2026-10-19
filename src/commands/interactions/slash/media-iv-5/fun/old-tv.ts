import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'old-tv';

export class MediaIVOldTVCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Show an Image or Video on an old TV';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.old_tv.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOldTV.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.old_tv.name');

  constructor() {
    super({
      options: [
        {name: 'still', description: 'One still image instead of the flickering animation', ...I18n.optionLocalizations('commands.media_iv_5.fun.old_tv.still'), type: Boolean},
        {name: 'grayscale', description: 'Black and white instead of faded color', ...I18n.optionLocalizations('commands.media_iv_5.fun.old_tv.grayscale'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOldTV.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOldTV.createMessage(context, args);
  }
}
