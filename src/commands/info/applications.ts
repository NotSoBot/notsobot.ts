import { Command, Constants, Structures, Utils } from 'detritus-client';

const { Colors } = Constants;

import { CommandTypes } from '../../constants';
import {
  Paginator,
  Parameters,
  onRunError,
  onTypeError,
} from '../../utils';


export interface CommandArgs {
  applications: Array<Structures.Application>,
}

export default (<Command.CommandOptions> {
  name: 'applications',
  aliases: ['application', 'games', 'game', 'applicationinfo', 'gameinfo'],
  metadata: {
    description: 'Get information about multiple (or one) application (Uses the same list Discord does)',
    examples: [
      'applications rust',
      'applications 356888738724446208',
    ],
    type: CommandTypes.INFO,
    usage: 'applications ?<id|name>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  type: Parameters.applications,
  onBefore: (context) => !!(context.channel && context.channel.canEmbedLinks),
  onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!args.applications.length,
  onCancelRun: (context, args) => context.editOrReply('⚠ Unable to find that game.'),
  run: async (context, args: CommandArgs) => {
    const { applications } = args;

    const pageLimit = applications.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const application = applications[page - 1];

        const embed = new Utils.Embed();
        embed.setColor(Colors.BLURPLE);

        if (1 < pageLimit) {
          embed.setTitle(`(${page} of ${pageLimit})`);
        }
        if (application.icon) {
          const iconUrl = <string> application.iconUrlFormat(null, {size: 1024});
          embed.setAuthor(application.name, iconUrl);
        } else {
          embed.setAuthor(application.name);
        }
        embed.setDescription([
          `**Id**: \`${application.id}\`\n`,
          application.description,
        ].join('\n'));

        if (application.splash) {
          const thumbnail = <string> application.splashUrlFormat(null, {size: 1024});
          embed.setThumbnail(thumbnail);
        }

        if (application.coverImage) {
          const image = <string> application.coverImageUrlFormat(null, {size: 128});
          embed.setImage(image);
        }

        if (application.aliases) {
          embed.addField('Aliases', application.aliases.join(', '));
        }

        if (application.publishers && application.publishers.length) {
          const publishers = application.publishers.map((publisher: Structures.ApplicationPublisher) => publisher.name);
          embed.addField('Publishers', publishers.join(', '));
        }

        {
          const description = new Set();
          if (application.isOnDiscord) {
            description.add(`[**Discord**](${application.jumpLink})`);
          }
          if (application.thirdPartySkus) {
            for (let [key, thirdPartySku] of application.thirdPartySkus) {
              const url = thirdPartySku.url;
              if (url) {
                description.add(`[**${thirdPartySku.name}**](${url})`);
              }
            }
          }
          if (description.size) {
            embed.addField('Store Links', Array.from(description).join(', '), true);
          }
        }

        if (application.youtubeTrailerVideoId) {
          const url = <string> application.youtubeTrailerUrl;
          embed.addField('Trailer', `[**YouTube**](${url})`, true);
        }

        embed.setFooter('Added to Discord');
        embed.setTimestamp(application.createdAt);

        return embed;
      },
    });
    return await paginator.start();
  },
  onRunError,
  onTypeError,
});
