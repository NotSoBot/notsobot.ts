import { Interaction } from 'detritus-client';

import { MLDiffusionModels, MLDiffusionModelsToText } from '../../../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mashup';

export class ToolsMLMashupCommand extends BaseInteractionMediasCommandOption {
  description = 'Mashup two emojis together using Google\'s Emoji Kitchen or AI';
  metadata = {
    id: Formatter.Commands.ToolsMLMashup.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Diffusion Model',
          value: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlDiffusionModel,
        },
        {
          name: 'safe',
          description: 'Safe Generation',
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
        {name: 'seed', type: Number, description: 'Initial Noise'},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1 to 16)'},
        {name: 'strength', description: 'Strength of Prompt (0.01 to 1)'},
      ],
      minAmount: 2,
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLMashup.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLMashup.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args:  Formatter.Commands.ToolsMLMashup.CommandArgs) {
    return Formatter.Commands.ToolsMLMashup.createMessage(context, args);
  }
}
