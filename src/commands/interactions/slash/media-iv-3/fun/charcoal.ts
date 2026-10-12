import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'charcoal';

export class MediaIVCharcoalCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Charcoal Drawing effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.charcoal.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCharcoal.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.charcoal.name');

  constructor() {
    super({
      options: [
        {name: 'radius', description: 'Charcoal Radius (1..10) (Default: 2)', ...I18n.optionLocalizations('commands.media_iv_3.fun.charcoal.radius'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCharcoal.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCharcoal.createMessage(context, args);
  }
}
