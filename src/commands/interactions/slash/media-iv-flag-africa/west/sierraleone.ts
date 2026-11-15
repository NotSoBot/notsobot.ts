import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sierraleone';

export class MediaIVFlagSierraLeoneCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Sierra Leonean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.sierraleone.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.sierraleone.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.createMessage(context, args);
  }
}
