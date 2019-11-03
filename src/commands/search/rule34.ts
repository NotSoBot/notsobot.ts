import * as moment from 'moment';

import { Command, Constants, Utils } from 'detritus-client';
const { Permissions } = Constants;
const { Embed, Markup } = Utils;

import { searchRule34 } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
}

export interface CommandArgs {
  query: string,
}

export default class Rule34Command extends BaseCommand {
  aliases = ['r34'];
  name = 'rule34';

  label = 'query';
  metadata = {
    description: 'Search https://rule34.xxx',
    examples: [
      'rule34 some anime chick',
    ],
    type: CommandTypes.SEARCH,
    usage: 'rule34 <query>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];

  onBefore(context: Command.Context) {
    if (context.channel) {
      return context.channel.isDm || context.channel.nsfw;
    }
    return false;
  }

  onCancel(context: Command.Context) {
    return context.editOrReply('⚠ Not a NSFW channel.');
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.query;
  }

  onCancelRun(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('⚠ Provide some kind of search term.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const results = await searchRule34(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }
          embed.setFooter(`Page ${page}/${pageLimit} of https://rule34.xxx Results`);

          embed.setTitle((result.is_video) ? 'Video Post' : 'Image Post');
          embed.setUrl(result.url);

          const description: Array<string> = [];
          description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          description.push(`**Score**: ${result.score.toLocaleString()}`);
          if (result.source) {
            if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
              const cite = <string> (<string> result.source.split('://')[1]).split('/').shift();
              description.push(`**Source**: ${Markup.url(Markup.escape.all(cite), result.source)}`);
            } else {
              description.push(`**Source**: ${result.source}`);
            }
          }
          if (result.tags.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.sort().join(', '))}`);
          }
          embed.setDescription(description.join('\n'));

          let imageUrl: string;
          if (result.is_video) {
            imageUrl = result.thumbnail_url;
          } else {
            imageUrl = result.file_url;
          }
          embed.setImage(imageUrl);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any images for that search term');
    }
  }
}
