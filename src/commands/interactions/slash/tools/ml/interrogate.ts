import { Interaction } from 'detritus-client';

import { CommandRatelimits, MLInterrogateModels, MLInterrogateModelsToText } from '../../../../../constants';
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

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Captioning Model (Default: Florence-2)',
          ...I18n.optionLocalizations('commands.tools.ml.interrogate.model'),
          choices: Object.values(MLInterrogateModels).map((value) => ({name: MLInterrogateModelsToText[value], value})),
        },
      ],
      ratelimits: CommandRatelimits.ML,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLInterrogate.CommandArgs) {
    return Formatter.Commands.ToolsMLInterrogate.createMessage(context, args);
  }
}
