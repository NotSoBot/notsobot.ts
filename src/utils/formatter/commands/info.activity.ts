import { Command, Interaction, Structures } from 'detritus-client';

import { PresenceStatusColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  formatTime,
} from '../../../utils';

import { createActivityLines, createPresenceLine } from './info.shared';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


export const COMMAND_ID = 'info.activity';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  const { user } = args;

  const presence = user.presence;
  let activities: Array<Structures.PresenceActivity>;
  if (presence) {
    activities = presence.activities.sort((x, y) => {
      return x.position - y.position;
    });
  } else {
    activities = [];
  }

  const pageLimit = activities.length || 1;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const payload: DisplayPayload = {};
      payload.color = PresenceStatusColors['offline'];
      payload.title = user.toString();
      payload.url = user.jumpLink;
      payload.thumbnail = user.avatarUrlFormat(null, {size: 1024});

      const lines: Array<string> = [createPresenceLine(translator, presence || null)];
      if (presence) {
        if (presence.status in PresenceStatusColors) {
          payload.color = PresenceStatusColors[presence.status];
        }

        const activityId = page - 1;
        if (activityId in activities) {
          const activity = activities[activityId];

          const title = (1 < pageLimit) ? translate('activity.title_paged', {page, total: pageLimit}) : translate('activity.title');
          lines.push(...createActivityLines(translator, activity, title));

          const thumbnail = activity.imageUrlFormat(null, {size: 1024});
          if (thumbnail) {
            payload.thumbnail = thumbnail;
          }

          const assets = activity.assets;
          if (assets && assets.smallText) {
            payload.footer = assets.smallText;
            payload.footerIconUrl = assets.smallImageUrl || undefined;
          }

          {
            let time: string | null = null;
            const timestamps = activity.timestamps;
            if (timestamps) {
              const elapsed = formatTime(Math.max(timestamps.elapsedTime, 0));
              time = (timestamps.end) ? `${elapsed}/${formatTime(timestamps.totalTime)}` : elapsed;
            }

            let group: string | null = null;
            if (activity.party) {
              const users = activity.group.map((user: Structures.User) => user.mention);
              if (users.length) {
                group = displayDetail(translate('activity.group', {count: users.length.toLocaleString(language)}), users.join(', '));
              }
            }

            lines.push(displayDetailsLine([
              (time) && displayDetail(translate('activity.time'), time),
              (activity.party && activity.party.size) && displayDetail(translate('activity.party'), translate('activity.party_size', {size: String(activity.partySize), max: String(activity.partyMaxSize)})),
              group,
            ]));
          }

          {
            const links: Array<[string, null | string | undefined]> = [];
            if (activity.isOnSpotify) {
              links.push([activity.details || translate('activity.spotify_track'), activity.spotifyTrackUrl]);
            }
            const application = activity.application;
            if (application) {
              if (application.isOnDiscord) {
                links.push(['Discord', application.jumpLink]);
              }
              if (application.thirdPartySkus) {
                for (let [, thirdPartySku] of application.thirdPartySkus) {
                  links.push([thirdPartySku.name, thirdPartySku.url]);
                }
              }
            }
            lines.push(displayLinks(links));
          }

          if (activity.createdAt) {
            payload.footer = translate('activity.started');
            payload.timestamp = activity.createdAt;
          }
        }
      }

      payload.description = displayDetails(lines);

      return {display: payload};
    },
  });
  return await paginator.start();
}
