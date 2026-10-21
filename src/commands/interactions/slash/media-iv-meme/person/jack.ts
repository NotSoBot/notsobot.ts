import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'jack';

export class MediaIVMemeJacksfilms1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a sheet of paper held by jacksfilms';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.jack.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsJacksfilms1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.jack.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsJacksfilms1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsJacksfilms1.createMessage(context, args);
  }
}
