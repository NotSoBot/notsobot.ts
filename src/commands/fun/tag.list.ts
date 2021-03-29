import { Command, CommandClient, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchUserTags } from '../../api';
import { RestResponsesRaw } from '../../api/types';
import { CommandTypes, EmbedColors } from '../../constants';
import {
  DefaultParameters,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
} from '../../utils';

import { BaseCommand } from '../basecommand';


export const RESULTS_PER_PAGE = 30;

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
    const { count, tags } = await fetchUserTags(context, args.user.id, {
      serverId: context.guildId || context.channelId,
    });

    const pages = chunkArray<RestResponsesRaw.Tag>(tags, RESULTS_PER_PAGE);
    if (pages.length) {
      const pageLimit = pages.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (pageNumber) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          let footer = `${args.user}'s Tags`;
          if (pageLimit !== 1) {
            footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
          }
          embed.setFooter(`${footer} (${count.toLocaleString()} Total Tags)`);

          const page = pages[pageNumber - 1];

          {
            for (let i = 0; i < page.length; i += RESULTS_PER_PAGE / 2) {
              const description: Array<string> = [];

              const section = page.slice(i, i + RESULTS_PER_PAGE / 2);
              for (let x = 0; x < section.length; x++) {
                const tag = section[x];
                description.push(`**${(i + x + 1) + ((pageNumber - 1) * RESULTS_PER_PAGE)}**. ${Markup.escape.all(tag.name)}`);

                /*
                {
                  const timestamp = createTimestampMomentFromGuild(tag.edited || tag.created, context.guildId);
                  description.push(`**->** ${(tag.edited) ? 'Edited' : 'Created'} ${timestamp.fromNow()}`);
                }
                */
              }

              embed.addField('\u200b', description.join('\n'), true);
            }
          }

          return embed;
        },
      });
      return await paginator.start();
    }

    return editOrReply(context, (args.user.id === context.userId) ? 'You don\'t have any tags here' : 'They don\'t have any tags here');
  }
}
