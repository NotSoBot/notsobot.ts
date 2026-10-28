import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'safetylabels';

export default class SafetyLabelsCommand extends BaseImageCommand<Formatter.Commands.ToolsSafetyLabels.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['slabels', 'safelabels', 'isnsfw'],
      metadata: {
        description: 'Get the safety labels of an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.AI,
        id: Formatter.Commands.ToolsSafetyLabels.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsSafetyLabels.CommandArgs) {
    return Formatter.Commands.ToolsSafetyLabels.createMessage(context, args);
  }
}
