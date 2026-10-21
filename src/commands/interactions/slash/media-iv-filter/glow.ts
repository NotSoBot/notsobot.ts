import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'glow';

export class MediaIVGlowCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a soft glow to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.glow.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlow.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.glow.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Glow Blur Amount', ...I18n.optionLocalizations('commands.media_iv_3.fun.glow.amount'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlow.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlow.createMessage(context, args);
  }
}
