import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'tag list';

export default class TagListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t list'],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        category: CommandCategories.FUN,
        description: 'List all of a user\'s tags',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        id: Formatter.Commands.TagListUser.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      type: Parameters.memberOrUser({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.TagListUser.createMessage(context, args);
  }
}
