import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import {
  PRESENCE_CLIENT_STATUS_KEYS,
  PresenceStatusColors,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  formatTime,
  toTitleCase,
} from '../../../utils';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


export const COMMAND_ID = 'activity';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

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
      const payload: DisplayPayload = {fields: []};
      payload.color = PresenceStatusColors['offline'];
      payload.title = user.toString();
      payload.url = user.jumpLink;
      payload.thumbnail = user.avatarUrlFormat(null, {size: 1024});

      if (presence) {
        if (presence.clientStatus) {
          const description = [];
          for (let key of PRESENCE_CLIENT_STATUS_KEYS) {
            let status = (presence.clientStatus as any)[key] as string | undefined;
            if (status) {
              description.push(`**${translateMaybe(`presence.client.${key}`, toTitleCase(key))}**: ${translateMaybe(`presence.status.${status}`, status)}`);
            }
          }
          payload.fields!.push({name: translate('presence.status'), value: description.join('\n')});
        } else {
          const status = translateMaybe(`presence.status.${presence.status}`, presence.status);
          payload.fields!.push({inline: true, name: translate('presence.status'), value: status});
        }

        if (presence.status in PresenceStatusColors) {
          payload.color = PresenceStatusColors[presence.status];
        }

        const activityId = page - 1;
        if (activityId in activities) {
          const activity = activities[activityId];

          {
            const description: Array<string> = [];
            if (activity.buttons && activity.buttons.length) {
              description.push(`**${translate('activity.buttons')}**: ${activity.buttons.map((button) => Markup.codestring(button)).join(', ')}`);
            }
            if (activity.emoji) {
              let emoji: string;
              if (activity.emoji.id) {
                emoji = `[${activity.emoji.format}](${activity.emoji.url})`;
              } else {
                emoji = activity.emoji.format;
              }
              description.push(`**${translate('activity.emoji')}**: ${emoji}`);
            }
            if (activity.isCustomStatus) {
              if (activity.state) {
                description.push(`**${translate('activity.custom_status')}**: ${Markup.escape.all(activity.state)}`);
              } else {
                description.push(`**${translate('activity.custom_status')}**`);
              }
              if (activity.name !== 'Custom Status') {
                description.push(`**${translate('activity.hidden_message')}**: ${Markup.escape.all(activity.name || '')}`);
              }
            } else {
              const text = [translateMaybe(`activity.type.${activity.type}`, activity.typeText), Markup.escape.all(activity.name || '')];
              description.push(text.filter((v) => v).join(' '));
              if (activity.isOnSpotify) {
                if (activity.assets && activity.assets.largeText) {
                  description.push(`**${translate('activity.album')}**: ${activity.assets.largeText}`);
                }
                if (activity.details) {
                  description.push(`**${translate('activity.song')}**: ${activity.details}`);
                }
                if (activity.state) {
                  description.push(`**${translate('activity.artists')}**: ${activity.state.split('; ').join(', ')}`);
                }
              } else {
                if (activity.details) {
                  description.push(`**${translate('activity.details')}**: ${Markup.escape.all(activity.details)}`);
                }
                if (activity.state) {
                  description.push(`**${translate('activity.state')}**: ${Markup.escape.all(activity.state)}`);
                }
              }
              if (activity.isOnSamsung) {
                description.push(`**${translate('activity.on_samsung')}**`);
              }
              if (activity.isOnXbox) {
                description.push(`**${translate('activity.on_xbox')}**`);
              }
            }
            let name = translate('activity.title');
            if (1 < pageLimit) {
              name = translate('activity.title_paged', {page, total: pageLimit});
            }
            payload.fields!.push({inline: true, name: name, value: description.join('\n')});
          }

          // now do the fields
          const thumbnail = activity.imageUrlFormat(null, {size: 1024});
          if (thumbnail) {
            payload.thumbnail = thumbnail;
          }

          const assets = activity.assets;
          if (assets && assets.smallText) {
            payload.footer = assets.smallText;
            payload.footerIconUrl = assets.smallImageUrl || undefined;
          }

          const timestamps = activity.timestamps;
          if (timestamps) {
            const elapsed = formatTime(Math.max(timestamps.elapsedTime, 0));
            const total = formatTime(timestamps.totalTime);

            const description = (timestamps.end) ? `${elapsed}/${total}` : `${elapsed}`;
            payload.fields!.push({inline: true, name: translate('activity.time'), value: description});
          }

          if (activity.party) {
            const group = activity.group.map((user: Structures.User) => {
              return user.mention;
            });

            const description = [];
            if (activity.party.size) {
              description.push(translate('activity.party_size', {size: String(activity.partySize), max: String(activity.partyMaxSize)}));
            }
            if (group.length) {
              description.push(`**${translate('activity.group', {count: group.length.toLocaleString(language)})}**: ${group.join(', ')}`);
            }
            if (description.length) {
              payload.fields!.push({name: translate('activity.party'), value: description.join('\n')});
            }
          }

          const application = activity.application;
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
              payload.fields!.push({inline: true, name: translate('activity.store_links'), value: Array.from(description).join(', ')});
            }
          }

          if (activity.isOnSpotify) {
            const description = [];
            if (activity.details) {
              description.push(`[**${activity.details}**](${activity.spotifyTrackUrl})`);
            } else {
              description.push(<string> activity.spotifyTrackUrl);
            }
            payload.fields!.push({inline: true, name: translate('activity.spotify_track'), value: description.join('\n')});
          }

          if (activity.createdAt) {
            payload.footer = translate('activity.started');
            payload.timestamp = activity.createdAt;
          }
        }
      } else {
        payload.fields!.push({name: translate('activity.title'), value: translate('presence.status.offline')});
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}
