import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'marshallislands';

export class MediaIVFlagMarshallIslandsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Marshallese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.marshallislands.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMarshallIslands.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.marshallislands.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMarshallIslands.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMarshallIslands.createMessage(context, args);
  }
}
