import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'god';

export class MediaIVMemeGodCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video a reverse image search result for god';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.god.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayGod.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.god.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayGod.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayGod.createMessage(context, args);
  }
}
