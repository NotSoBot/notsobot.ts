import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'guineabissau';

export class MediaIVFlagGuineaBissauCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bissau-Guinean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.guineabissau.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGuineaBissau.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.guineabissau.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGuineaBissau.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGuineaBissau.createMessage(context, args);
  }
}
