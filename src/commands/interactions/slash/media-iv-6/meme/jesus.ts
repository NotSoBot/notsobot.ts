import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'jesus';

export class MediaIVMemeJesus1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a card held by Jesus';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.jesus.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsJesus1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.jesus.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsJesus1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsJesus1.createMessage(context, args);
  }
}
