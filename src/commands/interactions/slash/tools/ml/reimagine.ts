import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reimagine';

export class ToolsMLReimagineCommand extends BaseInteractionImageCommandOption {
  description = 'Interrogate an Image for a prompt then generate that prompt';
  metadata = {
    id: Formatter.Commands.ToolsMLReimagine.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'add', description: 'Add text to generated prompt'},
        {name: 'model', description: 'Diffusion Model', choices: Parameters.Slash.ML_IMAGINE_MODELS},
        {name: 'seed', type: Number, description: 'Initial Noise'},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1..8)'},
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
