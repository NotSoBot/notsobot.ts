import { Command, Structures, Utils } from 'detritus-client';

import {
  Paginator,
  Parameters,
} from '../utils';


export default (<Command.CommandOptions> {
  name: 'applications',
  aliases: ['application', 'games', 'game', 'applicationinfo', 'gameinfo'],
  label: 'applications',
  ratelimit: {
    duration: 4000,
    limit: 5,
    type: 'guild',
  },
  type: Parameters.applications,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!(args.applications && args.applications.length),
  onCancelRun: (context, args) => {
    if (args.applications) {
      return context.editOrReply('⚠ Unable to find that game.');
    } else {
      return context.editOrReply('⚠ Provide some kind of game name.');
    }
  },
  run: async (context, args) => {
    const applications: Array<Structures.Application> = args.applications;

    const pageLimit = applications.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const application = applications[page - 1];

        const embed = new Utils.Embed();
        if (1 < pageLimit) {
          embed.setTitle(`(${page} of ${pageLimit})`);
        }
        if (application.icon) {
          const iconUrl = <string> application.iconUrlFormat(null, {size: 1024});
          embed.setAuthor(application.name, iconUrl);
        } else {
          embed.setAuthor(application.name);
        }
        embed.setDescription(application.description);

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
          const publishers = application.publishers.map((publisher) => publisher.name);
          embed.addField('Publishers', publishers.join(', '));
        }

        if (application) {
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

        embed.setFooter('Added to Discord');
        embed.setTimestamp(application.createdAt);

        return embed;
      },
    });
    await paginator.start();
  },
  onRunError: (context, args, error) => {
    console.error(error);
  },
});
