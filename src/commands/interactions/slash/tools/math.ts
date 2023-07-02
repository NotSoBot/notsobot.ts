import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsMathCommand extends BaseInteractionCommandOption {
  description = 'Evaluate a Math Equation';
  metadata = {
    id: Formatter.Commands.ToolsMath.COMMAND_ID,
  };
  name = 'math';

  constructor() {
    super({
      options: [
        {
          name: 'equation',
          description: 'Math Equation',
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMath.CommandArgs) {
    return Formatter.Commands.ToolsMath.createMessage(context, args);
  }
}
