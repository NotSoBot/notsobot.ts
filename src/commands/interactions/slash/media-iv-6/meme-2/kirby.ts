import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kirby';

export class MediaIVMemeKirbyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach a "Kirby\'s Calling the Police" panel under an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.kirby.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsKirby.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.kirby.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsKirby.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsKirby.createMessage(context, args);
  }
}
