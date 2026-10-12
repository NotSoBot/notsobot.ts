import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glitch';

export class MediaIVGlitchCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Glitch an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.glitch.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlitch.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Glitch Amount (1..99) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch.amount'), type: Number},
        {name: 'iterations', description: 'Glitch Iterations (1..115) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch.iterations'), type: Number},
        {name: 'notransparency', description: 'Do not keep transparency', ...I18n.optionLocalizations('commands.media_iv.fun.glitch.notransparency'), type: Boolean},
        {name: 'seed', description: 'Randomization Seed (1..99) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlitch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlitch.createMessage(context, args);
  }
}
