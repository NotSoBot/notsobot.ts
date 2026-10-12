import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trace';

export class MediaIVTraceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Trace an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.trace.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTrace.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.trace.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTrace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTrace.createMessage(context, args);
  }
}
