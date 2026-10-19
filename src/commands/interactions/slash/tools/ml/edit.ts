import { Interaction } from 'detritus-client';

import { MLDiffusionModels, MLDiffusionModelsToText } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'edit';

export class ToolsMLEditCommand extends BaseInteractionMediasCommandOption {
  description = 'Alter an Image with Machine Learning';
  descriptionLocalizations = I18n.localizations('commands.tools.ml.edit.description');
  metadata = {
    credits: Formatter.Commands.ToolsMLEdit.CREDITS,
    id: Formatter.Commands.ToolsMLEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.ml.edit.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Prompt to edit the Image with',
          ...I18n.optionLocalizations('commands.tools.ml.edit.query'),
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'expand',
          description: 'Expand Image',
          ...I18n.optionLocalizations('commands.tools.ml.edit.expand'),
          type: Boolean,
        },
        {
          name: 'model',
          description: 'Diffusion Model',
          ...I18n.optionLocalizations('commands.tools.ml.edit.model'),
          value: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlDiffusionModel,
        },
        {name: 'seed', type: Number, description: 'Initial Noise', ...I18n.optionLocalizations('commands.tools.ml.edit.seed')},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1 to 16)', ...I18n.optionLocalizations('commands.tools.ml.edit.steps')},
        {name: 'strength', description: 'Strength of Prompt (0.01 to 1)', ...I18n.optionLocalizations('commands.tools.ml.edit.strength')},
      ],
      maxAmount: 3,
      minAmount: 1,
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args:  Formatter.Commands.ToolsMLEdit.CommandArgs) {
    return Formatter.Commands.ToolsMLEdit.createMessage(context, args);
  }
}
