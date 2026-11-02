import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerFontsListCommand extends BaseInteractionCommandOption {
  description = 'List the server\'s saved fonts';
  metadata = {
    id: Formatter.Commands.ServerFontsList.COMMAND_ID,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerFontsList.CommandArgs) {
    return Formatter.Commands.ServerFontsList.createMessage(context, args);
  }
}
