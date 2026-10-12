import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'dice';

export class MediaIVDiceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Cut an Image or Video into tiles and randomly rotate each one';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.dice.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDice.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.dice.name');

  constructor() {
    super({
      options: [
        {name: 'grid', description: 'Tiles across the shortest side (2..32) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_3.fun.dice.grid'), type: Number},
        {name: 'seed', description: 'Random Seed, reuse it to get the same result', ...I18n.optionLocalizations('commands.media_iv_3.fun.dice.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDice.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDice.createMessage(context, args);
  }
}
