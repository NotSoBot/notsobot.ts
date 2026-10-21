import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'owo';

export class MediaIVMemeOwOCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a monitor being stared at through binoculars';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.owo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayOwO.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.owo.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayOwO.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayOwO.createMessage(context, args);
  }
}
