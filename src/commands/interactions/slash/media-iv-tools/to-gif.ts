import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'to-gif';

export class MediaIVToolsToGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Convert an Image or Video to a gif, resizing and lowering fps as needed';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.to_gif.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationToGif.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.to_gif.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationToGif.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationToGif.createMessage(context, args);
  }
}
