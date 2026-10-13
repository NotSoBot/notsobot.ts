import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';
import { Paginator, createUserEmbed } from '../../../utils';


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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { applications } = args;

  const pageLimit = applications.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const application = applications[page - 1];

      const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
      embed.setColor(Colors.BLURPLE);
      embed.setTitle(application.name);

      {
        const description: Array<string> = [];
        description.push(`**${translate('common.id')}**: \`${application.id}\``);

        if (context.guild) {
          const presences = context.guild.presences.filter((presence) => presence.activities.some((activity) => activity.applicationId === application.id || activity.name === application.name));
          description.push(`**${translate('info.applications.members_playing')}**: ${presences.length.toLocaleString(language)}`);
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
        embed.addField(translate('info.applications.aliases'), application.aliases.join(', '));
      }

      if (application.publishers && application.publishers.length) {
        const publishers = application.publishers.map((publisher: Structures.ApplicationPublisher) => publisher.name);
        embed.addField(translate('info.applications.publishers'), publishers.join(', '));
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
          embed.addField(translate('activity.store_links'), Array.from(description).join(', '), true);
        }
      }

      if (application.youtubeTrailerVideoId) {
        const url = application.youtubeTrailerUrl as string;
        embed.addField(translate('info.applications.trailer'), `[**YouTube**](${url})`, true);
      }

      const footerIconUrl = (application.icon) ? application.iconUrlFormat(null, {size: 1024}) as string : undefined;
      if (1 < pageLimit) {
        embed.setFooter(`${translate('common.page_of', {page, total: pageLimit})} • ${translate('info.applications.added')}`, footerIconUrl);
      } else {
        embed.setFooter(translate('info.applications.added'), footerIconUrl);
      }
      embed.setTimestamp(application.createdAt);

      return embed;
    },
  });
  return await paginator.start();
}
