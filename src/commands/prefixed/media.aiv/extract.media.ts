import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'extract media';

export default class ExtractMediaCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['extract m', 'ex media', 'ex m'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Extract Audio and Frames from Media into a Zip File',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaAIVToolsExtractMedia.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsExtractMedia.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsExtractMedia.createMessage(context, args);
  }
}
