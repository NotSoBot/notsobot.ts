import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ireland';

export class MediaIVFlagIrelandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Irish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ireland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIreland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ireland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIreland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIreland.createMessage(context, args);
  }
}
