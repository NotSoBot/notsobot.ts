import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'iran';

export class MediaIVFlagIranCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Iranian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.iran.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIran.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.iran.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIran.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIran.createMessage(context, args);
  }
}
