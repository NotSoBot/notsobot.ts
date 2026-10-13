import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';

import { getTranslator } from '../../i18n';
import { DisplayPayload, Paginator } from '../../../utils';


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

  const { applications } = args;

  const pageLimit = applications.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const application = applications[page - 1];

      const payload: DisplayPayload = {fields: []};
      payload.color = Colors.BLURPLE;
      payload.title = application.name;

      {
        const description: Array<string> = [];
        description.push(`**${translate('common.id')}**: \`${application.id}\``);

        if (context.guild) {
          const presences = context.guild.presences.filter((presence) => presence.activities.some((activity) => activity.applicationId === application.id || activity.name === application.name));
          description.push(`**${translate('info.applications.members_playing')}**: ${presences.length.toLocaleString(language)}`);
        }

        description.push('');
        description.push(application.description);
        payload.description = description.join('\n');
      }

      if (application.splash) {
        const thumbnail = application.splashUrlFormat(null, {size: 1024}) as string;
        payload.thumbnail = thumbnail;
      }

      if (application.coverImage) {
        const image = application.coverImageUrlFormat(null, {size: 128}) as string;
        payload.image = image;
      }

      if (application.aliases) {
        payload.fields!.push({name: translate('info.applications.aliases'), value: application.aliases.join(', ')});
      }

      if (application.publishers && application.publishers.length) {
        const publishers = application.publishers.map((publisher: Structures.ApplicationPublisher) => publisher.name);
        payload.fields!.push({name: translate('info.applications.publishers'), value: publishers.join(', ')});
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
          payload.fields!.push({inline: true, name: translate('activity.store_links'), value: Array.from(description).join(', ')});
        }
      }

      if (application.youtubeTrailerVideoId) {
        const url = application.youtubeTrailerUrl as string;
        payload.fields!.push({inline: true, name: translate('info.applications.trailer'), value: `[**YouTube**](${url})`});
      }

      const footerIconUrl = (application.icon) ? application.iconUrlFormat(null, {size: 1024}) as string : undefined;
      if (1 < pageLimit) {
        payload.footer = `${translate('common.page_of', {page, total: pageLimit})} • ${translate('info.applications.added')}`;
        payload.footerIconUrl = footerIconUrl;
      } else {
        payload.footer = translate('info.applications.added');
        payload.footerIconUrl = footerIconUrl;
      }
      payload.timestamp = application.createdAt;

      return {display: payload};
    },
  });
  return await paginator.start();
}
