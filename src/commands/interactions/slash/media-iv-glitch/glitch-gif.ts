import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'glitch-gif';

export class MediaIVGlitchGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Glitch an Image or Video, Single-framed Images become Animated';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.glitch_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlitchAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Glitch Amount (1..99) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch_gif.amount'), type: Number},
        {name: 'iterations', description: 'Glitch Iterations (1..115) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch_gif.iterations'), type: Number},
        {name: 'notransparency', description: 'Do not keep transparency', ...I18n.optionLocalizations('commands.media_iv.fun.glitch_gif.notransparency'), type: Boolean},
        {name: 'seed', description: 'Randomization Seed (1..99) (Default: Random)', ...I18n.optionLocalizations('commands.media_iv.fun.glitch_gif.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlitchAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlitchAnimated.createMessage(context, args);
  }
}
