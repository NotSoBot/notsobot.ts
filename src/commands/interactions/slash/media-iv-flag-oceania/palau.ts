import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'palau';

export class MediaIVFlagPalauCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Palauan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.palau.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPalau.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.palau.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPalau.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPalau.createMessage(context, args);
  }
}
