import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'paper';

export class MediaIVPaperCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on some paper';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.paper.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaper.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.paper.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaper.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaper.createMessage(context, args);
  }
}
