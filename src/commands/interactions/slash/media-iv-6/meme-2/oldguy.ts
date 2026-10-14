import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'oldguy';

export class MediaIVMemeOldGuyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a monitor an old man is staring at';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.oldguy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayOldGuy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.oldguy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayOldGuy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayOldGuy.createMessage(context, args);
  }
}
