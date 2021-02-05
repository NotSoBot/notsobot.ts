import { Command, CommandClient } from 'detritus-client';
import { Markup, addQuery } from 'detritus-client/lib/utils';

import { searchWikihow, searchWikihowRandom } from '../../api';
import { CommandTypes, DateOptions, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
  random: boolean,
}

export interface CommandArgs {
  query: string,
  random: boolean,
}

export const COMMAND_NAME = 'wikihow';

export default class WikihowCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wiki', 'how'],
      args: [
        {name: 'random', type: Boolean},
      ],
      metadata: {
        description: 'Search WikiHow',
        examples: [
          `${COMMAND_NAME} cut tree`,
          `${COMMAND_NAME} -random`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query> (-random)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.query || !!args.random;
  }

  async run(context: Command.Context, args: CommandArgs) {
    if (args.random) {
      // have steps
      const result = await searchWikihowRandom(context);
      if (result.methods.length) {
        const [ method ] = result.methods;
        if (method.steps.length) {
          const pageLimit = method.steps.length;
          const paginator = new Paginator(context, {
            pageLimit,
            onPage: (page) => {
              const step = method.steps[page - 1];

              const embed = createUserEmbed(context.user);
              embed.setColor(EmbedColors.DEFAULT);
              embed.setTitle(result.title);

              embed.setImage(step.image);
              embed.setUrl(step.url);

              {
                const description: Array<string> = [];

                {
                  const { rating } = result;
                  description.push(`Rating: ${rating.value}% (${rating.count.toLocaleString()} Votes)`);
                }

                if (result.video) {
                  description.push(Markup.url('Video', result.video.url));
                }

                embed.setDescription(description.join('\n'));
              }

              embed.addField(`**Method 1: ${Markup.escape.all(method.title)}**`, `**Step ${page}:** ${Markup.escape.all(step.text, {limit: 1000})}`);

              embed.setFooter(`Step ${page}/${pageLimit} of ${method.title}`, EmbedBrands.NOTSOBOT);

              return embed;
            },
          });
          return await paginator.start();
        }
      }
      return context.editOrReply('/shrug');
    } else {
      const results = await searchWikihow(context, args);
      if (results.length) {
        const pageLimit = results.length;
        const paginator = new Paginator(context, {
          pageLimit,
          onPage: (page) => {
            const result = results[page - 1];
  
            const embed = createUserEmbed(context.user);
            embed.setColor(EmbedColors.DEFAULT);
            embed.setTitle(result.title);
            embed.setUrl(result.url);

            if (result.thumbnail) {
              embed.setImage(result.thumbnail);
            }

            {
              const description: Array<string> = [];
              description.push(`Last updated ${result.updated}`);
              description.push(`${result.views.toLocaleString()} Views`);
              if (result.badge) {
                description.push(`Badge: ${result.badge}`);
              }
              embed.setDescription(description.join('\n'));
            }
  
            embed.setFooter(`Page ${page}/${pageLimit} of Wikihow Results`, EmbedBrands.WIKIHOW);
  
            return embed;
          },
        });
        return await paginator.start();
      } else {
        return context.editOrReply('Couldn\'t find any guides for that search');
      }
    }
  }
}
