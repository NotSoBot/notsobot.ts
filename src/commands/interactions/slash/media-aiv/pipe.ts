import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pipe';

export class MediaAIVPipeCommand extends BaseInteractionMediaCommandOption {
  description = 'Pipe Multiple Media Commands Together';
  metadata = {
    id: Formatter.Commands.MediaAIVPipe.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'commands', description: 'Media Commands (ex: flip; flop)', required: true, value: Parameters.pipingCommands},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVPipe.CommandArgs) {
    return Formatter.Commands.MediaAIVPipe.createMessage(context, args);
  }
}
