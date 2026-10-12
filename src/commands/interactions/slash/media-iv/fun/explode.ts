import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'explode';

export class MediaIVExplodeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Explode an Image or Video from the center';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.explode.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationExplode.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.explode.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Explode Scale (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv.fun.explode.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationExplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationExplode.createMessage(context, args);
  }
}
