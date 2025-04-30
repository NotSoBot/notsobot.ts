import { Interaction } from 'detritus-client';

import { TagGenerationModels, TagGenerationModelsToText } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAIModelCommand extends BaseInteractionCommandOption {
  description = 'Set your default AI Model.';
  metadata = {
    id: Formatter.Commands.SettingsSetAIModel.COMMAND_ID,
  };
  name = 'ai-model';

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'AI Model',
          value: Parameters.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlLLMModel,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAIModel.CommandArgs) {
    return Formatter.Commands.SettingsSetAIModel.createMessage(context, args);
  }
}
