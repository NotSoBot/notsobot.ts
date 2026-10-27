import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'solomonislands';

export class MediaIVFlagSolomonIslandsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Solomon Islands flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.solomonislands.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.solomonislands.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.createMessage(context, args);
  }
}
