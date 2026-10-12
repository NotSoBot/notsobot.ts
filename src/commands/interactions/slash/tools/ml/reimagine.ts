import { Interaction } from 'detritus-client';

import { MLDiffusionModels, MLDiffusionModelsToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reimagine';

export class ToolsMLReimagineCommand extends BaseInteractionImageCommandOption {
  description = 'Interrogate an Image for a prompt then generate that prompt';
  descriptionLocalizations = I18n.localizations('commands.tools.ml.reimagine.description');
  metadata = {
    id: Formatter.Commands.ToolsMLReimagine.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.ml.reimagine.name');

  constructor() {
    super({
      options: [
        {name: 'add', description: 'Add text to generated prompt', ...I18n.optionLocalizations('commands.tools.ml.reimagine.add'), value: Parameters.parsedMentionsText},
        {
          name: 'model',
          description: 'Diffusion Model',
          ...I18n.optionLocalizations('commands.tools.ml.reimagine.model'),
          value: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlDiffusionModel,
        },
        {name: 'seed', type: Number, description: 'Initial Noise', ...I18n.optionLocalizations('commands.tools.ml.reimagine.seed')},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1..8)', ...I18n.optionLocalizations('commands.tools.ml.reimagine.steps')},
      ],
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLReimagine.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLReimagine.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLReimagine.CommandArgs) {
    return Formatter.Commands.ToolsMLReimagine.createMessage(context, args);
  }
}
