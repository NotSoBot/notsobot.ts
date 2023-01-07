import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag export';

export default class TagExportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t export'],
      args: [
        {name: 'content', type: Parameters.string({maxLength: 1000})},
        {name: 'name', type: Parameters.string({maxLength: 64})},
        {name: 'user', type: Parameters.memberOrUser({allowBots: false})},
      ],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Export tags from a server with filters',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -content discord.gg`,
          `${COMMAND_NAME} -name badword`,
          `${COMMAND_NAME} -user cake#1`,
        ],
        id: Formatter.Commands.TagExport.COMMAND_ID,
        usage: '(-content <string>) (-name <string>) (-user <user:id|mention|name>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    return args.user !== null;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    if (args.user === null) {
      return editOrReply(context, '⚠ Unable to find that user.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagExport.CommandArgs) {
    return Formatter.Commands.TagExport.createMessage(context, args);
  }
}
