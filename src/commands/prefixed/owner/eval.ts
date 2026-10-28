import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'eval';

export default class EvalCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'async', type: Boolean},
        {name: 'jsonspacing', default: 2, type: Number},
        {name: 'noreply', type: Boolean},
        {name: 'upload', type: Boolean},
      ],
      label: 'code',
      metadata: {
        description: 'Eval some code ;)',
        examples: [
          `${COMMAND_NAME} context.client.guilds.length`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerEval.COMMAND_ID,
        usage: '<code> (-async) (-jsonspacing <number>) (-noreply) (-upload)',
      },
      responseOptional: true,
      type: Parameters.codeblock,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerEval.CommandArgs) {
    return Formatter.Commands.OwnerEval.createMessage(context, args);
  }
}
