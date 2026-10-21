import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'cyprus';

export class MediaIVFlagCyprusCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Cypriot flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.cyprus.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCyprus.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.cyprus.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCyprus.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCyprus.createMessage(context, args);
  }
}
