import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'implode';

export class MediaIVImplodeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Implode an Image or Video from the center';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.implode.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationImplode.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.implode.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Implode Scale (Default: 1.0)', ...I18n.optionLocalizations('commands.media_iv.fun.implode.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationImplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationImplode.createMessage(context, args);
  }
}
