import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'excuse';

export class MediaIVMemeExcuseCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach an "excuse me what the fuck" panel under an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.excuse.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsExcuse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.excuse.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsExcuse.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsExcuse.createMessage(context, args);
  }
}
