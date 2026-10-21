import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'e2f';

export class MediaIVE2FCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Edges to Flesh an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.e2f.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEdges2Flesh.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEdges2Flesh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdges2Flesh.createMessage(context, args);
  }
}
