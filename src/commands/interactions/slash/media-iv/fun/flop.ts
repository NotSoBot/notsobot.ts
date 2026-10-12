import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flop';

export class MediaIVFlopCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flop an Image or Video (Horizontal Flip)';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.flop.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlop.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.flop.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlop.createMessage(context, args);
  }
}
