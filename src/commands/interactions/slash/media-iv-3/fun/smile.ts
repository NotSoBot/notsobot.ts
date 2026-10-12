import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'smile';

export class MediaIVSmileCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make all the characters in an Image or Video (first frame) smile so big.';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.smile.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSmile.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.smile.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSmile.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSmile.createMessage(context, args);
  }
}
