import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { Paginator } from '../../../utils';


export interface CommandArgsBefore {
  applications: Array<Structures.Application>,
}

export interface CommandArgs {
  applications: Array<Structures.Application>,
}


export const COMMAND_ID = 'applications';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { applications } = args;

  const pageLimit = applications.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const application = applications[page - 1];

      const embed = new Embed();
      embed.setColor(Colors.BLURPLE);

      if (1 < pageLimit) {
        embed.setTitle(`(${page} of ${pageLimit})`);
      }
      if (application.icon) {
        const iconUrl = application.iconUrlFormat(null, {size: 1024}) as string;
        embed.setAuthor(application.name, iconUrl);
      } else {
        embed.setAuthor(application.name);
      }

      {
        const description: Array<string> = [];
        description.push(`**Id**: \`${application.id}\``);

        if (context.guild) {
          const presences = context.guild.presences.filter((presence) => presence.activities.some((activity) => activity.applicationId === application.id || activity.name === application.name));
          description.push(`**Members Playing**: ${presences.length.toLocaleString()}`);
        }

        description.push('');
        description.push(application.description);
        embed.setDescription(description.join('\n'));
      }

      if (application.splash) {
        const thumbnail = application.splashUrlFormat(null, {size: 1024}) as string;
        embed.setThumbnail(thumbnail);
      }

      if (application.coverImage) {
        const image = application.coverImageUrlFormat(null, {size: 128}) as string;
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
        const url = application.youtubeTrailerUrl as string;
        embed.addField('Trailer', `[**YouTube**](${url})`, true);
      }

      embed.setFooter('Added to Discord');
      embed.setTimestamp(application.createdAt);

      return embed;
    },
  });
  return await paginator.start();
}
