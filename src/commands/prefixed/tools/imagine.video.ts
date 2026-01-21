import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'imaginevideo';

export default class ImagineVideoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['imaginev'],
      label: 'query',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Generate a Video based off a prompt',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
        ],
        id: Formatter.Commands.ToolsMLImagineVideo.COMMAND_ID,
        usage: '<...query>',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLImagineVideo.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLImagineVideo.COMMAND_ID, type: 'channel'},
      ],
      type: Parameters.targetText,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLImagineVideo.CommandArgs) {
    return Formatter.Commands.ToolsMLImagineVideo.createMessage(context, args);
  }
}
