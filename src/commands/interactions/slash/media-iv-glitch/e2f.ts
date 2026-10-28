import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'e2f';

export class MediaIVE2FCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Trace an Image or Video\'s edges and have an AI fill them in with flesh';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.e2f.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEdges2Flesh.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEdges2Flesh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdges2Flesh.createMessage(context, args);
  }
}
