import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'iceland';

export class MediaIVFlagIcelandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Icelandic flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.iceland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIceland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.iceland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIceland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIceland.createMessage(context, args);
  }
}
