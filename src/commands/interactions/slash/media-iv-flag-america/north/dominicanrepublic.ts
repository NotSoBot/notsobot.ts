import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'dominicanrepublic';

export class MediaIVFlagDominicanRepublicCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Dominican Republic flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.dominicanrepublic.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.dominicanrepublic.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.createMessage(context, args);
  }
}
