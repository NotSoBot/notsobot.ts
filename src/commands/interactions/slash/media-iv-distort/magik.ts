import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'magik';

export class MediaIVMagikCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Magikify an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.magik.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMagik.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Magik Scale (1..10) (Default: 2.0)', ...I18n.optionLocalizations('commands.media_iv.fun.magik.scale'), maxValue: 10, minValue: 1, type: ApplicationCommandOptionTypes.NUMBER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMagik.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagik.createMessage(context, args);
  }
}
