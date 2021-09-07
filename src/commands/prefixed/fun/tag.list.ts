import { Command, CommandClient, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchUserTags } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes, EmbedColors } from '../../../constants';
import {
  DefaultParameters,
  Formatter,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
} from '../../../utils';

import { BaseCommand } from '../basecommand';


export const RESULTS_PER_PAGE = 28;

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
        description: 'List all of a user\'s tags',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        type: CommandTypes.FUN,
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
