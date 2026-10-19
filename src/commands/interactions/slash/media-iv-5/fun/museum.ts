import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'museum';

export class MediaIVMuseumCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Hang an Image or Video in a museum frame';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.museum.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMuseum.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.museum.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMuseum.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMuseum.createMessage(context, args);
  }
}
