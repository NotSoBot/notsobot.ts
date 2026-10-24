import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'turkey';

export class MediaIVFlagTurkeyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Turkish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.turkey.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTurkey.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.turkey.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTurkey.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTurkey.createMessage(context, args);
  }
}
