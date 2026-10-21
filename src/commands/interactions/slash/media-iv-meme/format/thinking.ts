import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'thinking';

export class MediaIVMemeThinkingCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into the face of the thinking emoji';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.thinking.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayThinking.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.thinking.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayThinking.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayThinking.createMessage(context, args);
  }
}
