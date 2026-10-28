import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export class ToolsMLInterrogateCommand extends BaseInteractionImageCommandOption {
  description = 'Generate a prompt from an Image';
  descriptionLocalizations = I18n.localizations('commands.tools.ml.interrogate.description');
  metadata = {
    id: Formatter.Commands.ToolsMLInterrogate.COMMAND_ID,
  };
  name = 'interrogate';
  nameLocalizations = I18n.localizations('commands.tools.ml.interrogate.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLInterrogate.CommandArgs) {
    return Formatter.Commands.ToolsMLInterrogate.createMessage(context, args);
  }
}
