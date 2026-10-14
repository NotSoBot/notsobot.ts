import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wheeze';

export class MediaIVMemeWheezeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video in the speech bubble of the Wheeze meme';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.wheeze.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayWheeze.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.wheeze.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayWheeze.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWheeze.createMessage(context, args);
  }
}
