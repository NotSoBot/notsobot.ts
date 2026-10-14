import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mistake';

export class MediaIVMemeMistakeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Erase an Image or Video with an eraser for really big mistakes';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.mistake.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayMistake.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.mistake.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayMistake.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayMistake.createMessage(context, args);
  }
}
