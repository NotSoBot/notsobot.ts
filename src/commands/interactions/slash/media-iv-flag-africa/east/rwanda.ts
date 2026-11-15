import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rwanda';

export class MediaIVFlagRwandaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Rwandan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.rwanda.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagRwanda.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.rwanda.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagRwanda.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagRwanda.createMessage(context, args);
  }
}
