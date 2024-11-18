import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export class ToolsMLInterrogateCommand extends BaseInteractionImageCommandOption {
  description = 'Interrogate an Image for a prompt';
  metadata = {
    id: Formatter.Commands.ToolsMLInterrogate.COMMAND_ID,
  };
  name = 'interrogate';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLInterrogate.CommandArgs) {
    return Formatter.Commands.ToolsMLInterrogate.createMessage(context, args);
  }
}
