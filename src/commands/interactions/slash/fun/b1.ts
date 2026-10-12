import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'b1';

export class B1Command extends BaseInteractionCommandOption {
  description = 'Cool B1 Emoji';
  descriptionLocalizations = I18n.localizations('commands.fun.b1.description');
  metadata = {
    id: Formatter.Commands.FunB1.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunB1.CommandArgs) {
    return Formatter.Commands.FunB1.createMessage(context, args);
  }
}
