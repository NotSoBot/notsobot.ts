import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'implode-gif';

export class MediaIVImplodeGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a gradually increasing Implode effect to a Single-framed Image';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.implode_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationImplodeAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.implode_gif.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Maximum Implode Scale (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.implode_gif.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationImplodeAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationImplodeAnimated.createMessage(context, args);
  }
}
