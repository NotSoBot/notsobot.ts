import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'blackpanther';

export class MediaIVMemeBlackPantherCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a cinema screen with a cheering crowd';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.blackpanther.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayBlackPanther.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.blackpanther.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayBlackPanther.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayBlackPanther.createMessage(context, args);
  }
}
