import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'charcoal-gif';

export class MediaIVCharcoalGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a gradually increasing Charcoal effect to a Single-framed Image';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.charcoal_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCharcoalAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.charcoal_gif.name');

  constructor() {
    super({
      options: [
        {name: 'radius', description: 'Maximum Charcoal Radius (2..10) (Default: 6)', ...I18n.optionLocalizations('commands.media_iv_3.fun.charcoal_gif.radius'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCharcoalAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCharcoalAnimated.createMessage(context, args);
  }
}
