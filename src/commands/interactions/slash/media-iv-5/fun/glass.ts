import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glass';

export class MediaIVGlassCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video behind shattered glass';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.glass.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlass.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.glass.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlass.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlass.createMessage(context, args);
  }
}
