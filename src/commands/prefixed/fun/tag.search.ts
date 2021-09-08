import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  name: string,
  user?: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  name: string,
  user?: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'tag search';

export default class TagSearchCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t search'],
      args: [{name: 'user', type: Parameters.memberOrUser({allowBots: false})}],
      label: 'name',
      metadata: {
        description: 'Search the Server\'s Tags',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} bot`,
          `${COMMAND_NAME} bot -user cake#1`,
          `${COMMAND_NAME} -user <@439205512425504771>`,
        ],
        type: CommandTypes.FUN,
        usage: '?<query> (-user ?<user:id|mention|name>)',
      },
      type: Parameters.tagName,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.name || !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Must provide some sort of search term or a user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.TagListServer.createMessage(context, args);
  }
}
