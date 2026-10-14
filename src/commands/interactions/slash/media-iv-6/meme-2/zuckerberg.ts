import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'zuckerberg';

export class MediaIVMemeZuckerberg1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video a Facebook post by Mark Zuckerberg';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.zuckerberg.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.zuckerberg.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.createMessage(context, args);
  }
}
