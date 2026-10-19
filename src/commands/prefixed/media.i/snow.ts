import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'snow';

export default class SnowWritingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['snowwriting'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text in the snow',
        examples: [
          `${COMMAND_NAME} line 1 | line 2`,
        ],
        id: Formatter.Commands.MediaICreateSnowWriting.COMMAND_ID,
        usage: '<text> (| <text 2>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateSnowWriting.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateSnowWriting.CommandArgs) {
    return Formatter.Commands.MediaICreateSnowWriting.createMessage(context, args);
  }
}
