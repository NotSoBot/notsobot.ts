import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


const HashTypes = Formatter.Commands.ToolsHash.HashTypes;
type CommandArgs = Formatter.Commands.ToolsHash.CommandArgs;

export class ToolsHashCommand extends BaseInteractionCommandOption {
  description = 'Create a hash from some text';
  name = 'hash';

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to hash',
          required: true,
        },
        {
          name: 'secret',
          description: 'Secret to use for an HMAC',
        },
        {
          name: 'use',
          description: 'Hash Type to Use',
          choices: Object.values(HashTypes).map((key) => {
            return {name: key, value: key};
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ToolsHash.createMessage(context, args);
  }
}
