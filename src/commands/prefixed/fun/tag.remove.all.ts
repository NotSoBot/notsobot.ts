import { Command, CommandClient } from 'detritus-client';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag remove all';

export default class TagRemoveAllCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t remove all'],
      args: [
        {name: 'content', type: Parameters.string({maxLength: 1000})},
        {name: 'name', type: Parameters.string({maxLength: 64})},
        {name: 'user', type: Parameters.memberOrUser({allowBots: false})},
      ],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Remove all of a server\'s tags, with filters',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -content discord.gg`,
          `${COMMAND_NAME} -name badword`,
          `${COMMAND_NAME} -user cake#1`,
        ],
        id: Formatter.Commands.TagRemoveAll.COMMAND_ID,
        usage: '(-content <string>) (-name <string>) (-user <user:id|mention|name>)',
      },
      priority: 1,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return args.user !== null;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    if (args.user === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user.`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return Formatter.Commands.TagRemoveAll.createMessage(context, args);
  }
}
