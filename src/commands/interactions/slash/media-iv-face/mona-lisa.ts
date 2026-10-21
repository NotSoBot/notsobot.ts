import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'mona-lisa';

export class MediaIVMonaLisaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video\'s face on the Mona Lisa';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.mona_lisa.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMonaLisa.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.mona_lisa.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMonaLisa.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMonaLisa.createMessage(context, args);
  }
}
