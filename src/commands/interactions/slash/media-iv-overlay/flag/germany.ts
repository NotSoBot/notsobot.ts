import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'germany';

export class MediaIVFlagGermanyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a German flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.germany.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGermany.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.germany.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGermany.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGermany.createMessage(context, args);
  }
}
