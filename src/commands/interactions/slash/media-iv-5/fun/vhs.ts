import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vhs';

export class MediaIVVHSCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video look like an old VHS tape';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.vhs.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationVHS.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.vhs.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationVHS.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationVHS.createMessage(context, args);
  }
}
