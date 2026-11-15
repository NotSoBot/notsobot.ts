import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'equatorialguinea';

export class MediaIVFlagEquatorialGuineaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Equatorial Guinean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.equatorialguinea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.equatorialguinea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.createMessage(context, args);
  }
}
