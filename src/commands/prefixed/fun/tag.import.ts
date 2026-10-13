import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag import';

export default class TagImportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t import'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Import tags from a NotSoBot tag export (attach the file)',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagImport.COMMAND_ID,
        usage: '<attached tag export>',
      },
    });
  }

  async run(context: Command.Context) {
    const attachment = context.message.attachments.first();
    return Formatter.Commands.TagImport.createMessage(context, {url: (attachment) ? attachment.url : null});
  }
}
