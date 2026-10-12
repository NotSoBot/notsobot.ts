import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'explode-gif';

export class MediaIVExplodeGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a gradually increasing Explode effect to a Single-framed Image';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.explode_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationExplodeAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.explode_gif.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Maximum Explode Scale (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.explode_gif.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationExplodeAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationExplodeAnimated.createMessage(context, args);
  }
}
