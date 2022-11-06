import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pipe';

export class ImagePipeCommand extends BaseInteractionImageCommandOption {
  description = 'Pipe Multiple Image Commands Together';
  metadata = {
    id: Formatter.Commands.ImagePipe.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'commands', description: 'Image Commands (ex: flip; flop)', required: true, value: Parameters.pipingCommands},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImagePipe.CommandArgs) {
    return Formatter.Commands.ImagePipe.createMessage(context, args);
  }
}
