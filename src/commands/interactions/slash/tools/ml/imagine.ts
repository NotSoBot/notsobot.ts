import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MLDiffusionModels, MLDiffusionModelsToText } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ToolsMLImagineCommand extends BaseInteractionCommandOption {
  description = 'Generate an Image based off a prompt';
  descriptionLocalizations = I18n.localizations('commands.tools.ml.imagine.description');
  metadata = {
    id: Formatter.Commands.ToolsMLImagine.COMMAND_ID,
  };
  name = 'imagine';
  nameLocalizations = I18n.localizations('commands.tools.ml.imagine.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Prompt to Generate (Empty will auto-generate a prompt)',
          ...I18n.optionLocalizations('commands.tools.ml.imagine.query'),
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'model',
          description: 'Diffusion Model',
          ...I18n.optionLocalizations('commands.tools.ml.imagine.model'),
          value: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlDiffusionModel,
        },
        {name: 'seed', type: Number, description: 'Initial Noise', ...I18n.optionLocalizations('commands.tools.ml.imagine.seed')},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1..8)', ...I18n.optionLocalizations('commands.tools.ml.imagine.steps')},
      ],
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLImagine.CommandArgs) {
    return Formatter.Commands.ToolsMLImagine.createMessage(context, args);
  }
}
