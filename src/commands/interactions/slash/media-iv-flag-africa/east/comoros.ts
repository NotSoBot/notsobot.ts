import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'comoros';

export class MediaIVFlagComorosCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Comorian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.comoros.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagComoros.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.comoros.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagComoros.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagComoros.createMessage(context, args);
  }
}
