import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ToolsMLImagineCommand extends BaseInteractionCommandOption {
  description = 'Generate an Image based off a prompt';
  metadata = {
    id: Formatter.Commands.ToolsMLImagine.COMMAND_ID,
  };
  name = 'imagine';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Prompt to Generate (Empty will auto-generate a prompt)'},
        {name: 'no', description: 'Negative Prompt'},
        {name: 'seed', type: Number, description: 'Initial Noise'},
        {name: 'steps', type: Number, description: 'Number of Samples to take (1..16)'},
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
