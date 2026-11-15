import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'southafrica';

export class MediaIVFlagSouthAfricaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a South African flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.southafrica.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSouthAfrica.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.southafrica.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSouthAfrica.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSouthAfrica.createMessage(context, args);
  }
}
