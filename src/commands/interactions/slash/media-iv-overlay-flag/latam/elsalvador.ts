import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'elsalvador';

export class MediaIVFlagElSalvadorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Salvadoran flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.elsalvador.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.elsalvador.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.createMessage(context, args);
  }
}
