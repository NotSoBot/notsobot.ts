import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ivorycoast';

export class MediaIVFlagIvoryCoastCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Ivorian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ivorycoast.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ivorycoast.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.createMessage(context, args);
  }
}
