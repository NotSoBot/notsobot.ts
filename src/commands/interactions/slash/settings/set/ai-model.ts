import { Interaction } from 'detritus-client';

import { TagGenerationModels, TagGenerationModelsToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetAIModelCommand extends BaseInteractionCommandOption {
  description = 'Set your default AI Model.';
  descriptionLocalizations = I18n.localizations('commands.settings.set.ai_model.description');
  metadata = {
    id: Formatter.Commands.SettingsSetAIModel.COMMAND_ID,
  };
  name = 'ai-model';
  nameLocalizations = I18n.localizations('commands.settings.set.ai_model.name');

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'AI Model',
          ...I18n.optionLocalizations('commands.settings.set.ai_model.model'),
          value: Parameters.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlLLMModel,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.ai_model.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetAIModel.CommandArgs) {
    return Formatter.Commands.SettingsSetAIModel.createMessage(context, args);
  }
}
