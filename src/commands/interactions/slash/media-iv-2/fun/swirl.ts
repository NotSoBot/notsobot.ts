import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'swirl';

export class MediaIVSwirlCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swirl an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.swirl.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwirl.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.swirl.name');

  constructor() {
    super({
      options: [
        {name: 'degrees', description: 'Swirl Degrees (-360..360)', ...I18n.optionLocalizations('commands.media_iv_2.fun.swirl.degrees'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwirl.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwirl.createMessage(context, args);
  }
}
