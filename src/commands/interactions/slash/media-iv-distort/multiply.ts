import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'multiply';

export class MediaIVMultiplyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Repeat an Image or Video in a grid';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.multiply.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMultiply.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.multiply.name');

  constructor() {
    super({
      options: [
        {name: 'grid', description: 'Tiles across the shortest side (2..32) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_3.fun.multiply.grid'), type: Number},
        {name: 'rotate', description: 'Randomly rotate each copy (Default: False)', ...I18n.optionLocalizations('commands.media_iv_3.fun.multiply.rotate'), type: Boolean},
        {name: 'seed', description: 'Random Seed, reuse it to get the same result', ...I18n.optionLocalizations('commands.media_iv_3.fun.multiply.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMultiply.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMultiply.createMessage(context, args);
  }
}
