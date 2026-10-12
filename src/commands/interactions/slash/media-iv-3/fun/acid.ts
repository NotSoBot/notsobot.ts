import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'acid';

export class MediaIVAcidCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Scramble the color palette of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.acid.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationAcid.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.acid.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Percentage of palette colors to corrupt (0..100) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_3.fun.acid.amount'), type: Number},
        {name: 'levels', description: 'Color levels per channel (2..16) (Default: 6)', ...I18n.optionLocalizations('commands.media_iv_3.fun.acid.levels'), type: Number},
        {name: 'seed', description: 'Random Seed, reuse it to get the same result', ...I18n.optionLocalizations('commands.media_iv_3.fun.acid.seed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationAcid.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationAcid.createMessage(context, args);
  }
}
