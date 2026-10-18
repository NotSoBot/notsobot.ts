import { Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
} from '../../../utils';


export interface CommandArgsBefore {
  applications: Array<Structures.Application>,
}

export interface CommandArgs {
  applications: Array<Structures.Application>,
}


export const COMMAND_ID = 'info.applications';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const { applications } = args;

  const pageLimit = applications.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const application = applications[page - 1];

      const payload: DisplayPayload = {};
      payload.color = Colors.BLURPLE;
      payload.title = application.name;

      if (application.splash) {
        payload.thumbnail = application.splashUrlFormat(null, {size: 1024}) as string;
      }
      if (application.coverImage) {
        payload.image = application.coverImageUrlFormat(null, {size: 128}) as string;
      }

      const lines: Array<string> = [];
      if (application.description) {
        lines.push(application.description);
      }

      let membersPlaying: string | null = null;
      if (context.guild) {
        const presences = context.guild.presences.filter((presence) => presence.activities.some((activity) => activity.applicationId === application.id || activity.name === application.name));
        membersPlaying = displayDetail(translate('info.applications.members_playing'), presences.length.toLocaleString(language));
      }
      lines.push(displayDetailsLine([
        membersPlaying,
        (application.publishers && application.publishers.length) && displayDetail(translate('info.applications.publishers'), application.publishers.map((publisher: Structures.ApplicationPublisher) => publisher.name).join(', ')),
      ]));
      if (application.aliases && application.aliases.length) {
        lines.push(displayDetail(translate('info.applications.aliases'), application.aliases.join(', ')));
      }

      lines.push(displayDetailsLine([`${translate('common.id')}: ${Markup.codestring(application.id)}`], true));

      {
        const links: Array<[string, null | string | undefined]> = [];
        if (application.isOnDiscord) {
          links.push(['Discord', application.jumpLink]);
        }
        if (application.thirdPartySkus) {
          for (let [, thirdPartySku] of application.thirdPartySkus) {
            links.push([thirdPartySku.name, thirdPartySku.url]);
          }
        }
        if (application.youtubeTrailerVideoId) {
          links.push([`${translate('info.applications.trailer')} (YouTube)`, application.youtubeTrailerUrl]);
        }
        lines.push(displayLinks(links));
      }

      payload.description = displayDetails(lines);

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
