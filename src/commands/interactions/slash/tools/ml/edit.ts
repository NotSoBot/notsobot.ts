import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'edit';

export class ToolsMLEditCommand extends BaseInteractionImageCommandOption {
  description = 'Alter an Image with Machine Learning';
  metadata = {
    id: Formatter.Commands.ToolsMLEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Prompt to edit the Image with'},
        {name: 'model', description: 'Diffusion Model', choices: Parameters.Slash.ML_IMAGINE_MODELS},
        {
          name: 'safe',
          description: 'Safe Generation',
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
        {name: 'seed', type: Number, description: 'Initial Noise'},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1..16)'},
      ],
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
