import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ascii-from-text';

export class AsciiFromTextCommand extends BaseInteractionCommandOption {
  description = 'Convert text to an ASCII Image';
  metadata = {
    id: Formatter.Commands.FunAsciiFromText.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Text to turn into ASCII Art', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAsciiFromText.CommandArgs) {
    return Formatter.Commands.FunAsciiFromText.createMessage(context, args);
  }
}
