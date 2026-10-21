import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'times-square';

export class MediaIVTimesquareCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put an Image or Video on a Times Square billboard';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.times_square.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTimesquare.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.times_square.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTimesquare.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTimesquare.createMessage(context, args);
  }
}
