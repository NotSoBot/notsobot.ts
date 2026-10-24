import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'macau';

export class MediaIVFlagMacauCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Macau flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.macau.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMacau.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.macau.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMacau.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMacau.createMessage(context, args);
  }
}
