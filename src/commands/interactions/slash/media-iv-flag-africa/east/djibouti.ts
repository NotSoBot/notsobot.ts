import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'djibouti';

export class MediaIVFlagDjiboutiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Djiboutian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.djibouti.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagDjibouti.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.djibouti.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagDjibouti.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDjibouti.createMessage(context, args);
  }
}
