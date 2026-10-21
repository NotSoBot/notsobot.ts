import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'scramble';

export class MediaIVScrambleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shuffle the tiles of an Image or Video around';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.scramble.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationScramble.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.scramble.name');

  constructor() {
    super({
      options: [
        {name: 'grid', description: 'Tiles across the shortest side (2..32) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_3.fun.scramble.grid'), type: Number},
        {name: 'rotate', description: 'Randomly rotate each tile (Default: True)', ...I18n.optionLocalizations('commands.media_iv_3.fun.scramble.rotate'), type: Boolean},
        {name: 'seed', description: 'Random Seed, reuse it to get the same result', ...I18n.optionLocalizations('commands.media_iv_3.fun.scramble.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationScramble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationScramble.createMessage(context, args);
  }
}
