import { ClusterClient, Command, CommandClient, Structures } from 'detritus-client';
import { Colors, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat } from '../../constants';
import {
  Paginator,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
  isSnowflake,
} from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  emojis: Array<Structures.Emoji>,
}

export interface CommandArgs {
  emojis: Array<Structures.Emoji>,
}

const ELEMENTS_PER_PAGE = 30;

async function emojisSearch(value: string, context: Command.Context) {
  value = value.toLowerCase();
  if (!value) {
    throw new Error('⚠ Please enter some kind of emoji name');
  }
  if (value.length <= 2) {
    throw new Error('⚠ Emoji names must be longer than 2 characters since we\'re searching through MILLIONS of emojis');
  }

  let chunks: Array<Array<Structures.Emoji>>;
  if (context.manager) {
    chunks = await context.manager.broadcastEval((cluster: ClusterClient, name: string, isSnowflake: boolean) => {
      const emojis: Array<Structures.Emoji> = [];
      for (let [shardId, shard] of cluster.shards) {
        if (isSnowflake) {
          const emoji = shard.emojis.get(null, name);
          if (emoji) {
            emojis.push(emoji);
          }
        } else {
          for (let [emojiId, emoji] of shard.emojis) {
            if (emoji.name.toLowerCase().includes(name)) {
              emojis.push(emoji);
            }
          }
        }
      }
      return emojis;
    }, value, isSnowflake(value));
  } else {
    chunks = [];
  }
  return chunks.flat().map((raw) => {
    return new Structures.Emoji(context.client, raw);
  }).sort((x, y) => (y.createdAtUnix as number) - (x.createdAtUnix as number));
}


export const COMMAND_NAME = 'emojis';

export default class EmojisCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Search through all emoji\'s that NotSoBot sees.',
        examples: [
          `${COMMAND_NAME} pepe`,
        ],
        type: CommandTypes.OWNER,
        usage: '<emoji:id|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: emojisSearch,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.emojis.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Couldn\'t find any emojis matching that.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { emojis } = args;

    const pages = chunkArray<Structures.Emoji>(emojis, ELEMENTS_PER_PAGE);
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = createUserEmbed(context.user);
        embed.setColor(Colors.BLURPLE);

        const title = `${emojis.length.toLocaleString()} Emojis Found`;
        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? title : `Page ${pageNumber}/${pageLimit} of ${title}`);

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = [];
          for (let key in page) {
            const emoji = page[key];

            const timestamp = createTimestampMomentFromGuild(emoji.createdAtUnix as number, context.guildId);

            const number = (+(key) + 1) + ((pageNumber - 1) * ELEMENTS_PER_PAGE);
            description.push([
              `${number}. ${Markup.url(emoji.format, emoji.url + `?g=${emoji.guildId}`)} - Created ${timestamp.fromNow()}`,
              //`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
            ].join('\n'));
          }

          {
            let text = '';
            while (text.length < 2048) {
              const part = description.shift();
              if (!part) {
                break;
              }
              if (2048 < text.length + part.length + 2) {
                description.unshift(part);
                break;
              }
              text += part + '\n';
            }
            embed.setDescription(text);
          }

          while (description.length) {
            if (5000 < embed.length) {
              break;
            }

            let text = '';
            while (text.length < 1024) {
              const part = description.shift();
              if (!part) {
                break;
              }
              if (1024 < text.length + part.length + 2) {
                description.unshift(part);
                break;
              }
              text += part + '\n';
            }
            embed.addField('\u200b', text);
          }
        }
        return embed;
      },
    });
    return await paginator.start();
  }
}
