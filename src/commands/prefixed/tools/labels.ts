import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'labels';

export default class LabelsCommand extends BaseImageCommand<Formatter.Commands.ToolsLabels.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Get the labels of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.TOOLS,
        id: Formatter.Commands.ToolsLabels.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsLabels.CommandArgs) {
    return Formatter.Commands.ToolsLabels.createMessage(context, args);
  }
}
