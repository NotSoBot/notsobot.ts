import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'czechia';

export class MediaIVFlagCzechiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Czech flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.czechia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCzechia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.czechia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCzechia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCzechia.createMessage(context, args);
  }
}
