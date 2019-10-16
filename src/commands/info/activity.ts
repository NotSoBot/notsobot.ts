import { Command, Structures, Utils } from 'detritus-client';

const { Markup } = Utils;

import {
  CommandTypes,
  PresenceStatusColors,
  PresenceStatusTexts,
  PRESENCE_CLIENT_STATUS_KEYS,
} from '../../constants';
import {
  formatTime,
  Paginator,
  Parameters,
  onRunError,
  onTypeError,
  toTitleCase,
} from '../../utils';


export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export default (<Command.CommandOptions> {
  name: 'activity',
  aliases: ['presence'],
  label: 'user',
  metadata: {
    description: 'Get a user\'s current activity, defaults to self',
    examples: [
      'activity',
      'activity notsobot',
    ],
    type: CommandTypes.INFO,
    usage: 'activity ?<id|mention|name>',
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  type: Parameters.memberOrUser,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!args.user,
  onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guy.'),
  run: async (context, args: CommandArgs) => {
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
        const embed = new Utils.Embed();
        embed.setAuthor(
          user.toString(),
          user.avatarUrlFormat(null, {size: 1024}),
          user.jumpLink,
        );
        embed.setColor(PresenceStatusColors['offline']);

        if (presence) {
          if (presence.clientStatus) {
            const description = [];
            for (let key of PRESENCE_CLIENT_STATUS_KEYS) {
              let status = (<any> presence.clientStatus)[key];
              if (status) {
                if (status in PresenceStatusTexts) {
                  status = PresenceStatusTexts[status];
                }
                description.push(`**${toTitleCase(key)}**: ${status}`);
              }
            }
            embed.addField('Status', description.join('\n'));
          } else {
            let status = presence.status;
            if (status in PresenceStatusTexts) {
              status = PresenceStatusTexts[status];
            }
            embed.addField('Status', status, true);
          }

          if (presence.status in PresenceStatusColors) {
            embed.setColor(PresenceStatusColors[presence.status]);
          }

          const activityId = page - 1;
          if (activityId in activities) {
            const activity = activities[activityId];

            {
              const description: Array<string> = [];
              if (activity.emoji) {
                let emoji: string;
                if (activity.emoji.id) {
                  emoji = `[${activity.emoji.format}](${activity.emoji.url})`;
                } else {
                  emoji = activity.emoji.format;
                }
                description.push(`**Emoji**: ${emoji}`);
              }
              if (activity.isCustomStatus) {
                description.push(`**Custom Status**: ${Markup.escape.all(activity.state || '')}`);
                if (activity.name !== 'Custom Status') {
                  description.push(`**Hidden Message**: ${Markup.escape.all(activity.name || '')}`);
                }
              } else {
                const text = [activity.typeText, Markup.escape.all(activity.name || '')];
                description.push(text.filter((v) => v).join(' '));
                if (activity.isOnSpotify) {
                  if (activity.assets && activity.assets.largeText) {
                    description.push(`**Album**: ${activity.assets.largeText}`);
                  }
                  if (activity.details) {
                    description.push(`**Song**: ${activity.details}`);
                  }
                  if (activity.state) {
                    description.push(`**Artists**: ${activity.state.split('; ').join(', ')}`);
                  }
                } else {
                  if (activity.details) {
                    description.push(`**Details**: ${Markup.escape.all(activity.details)}`);
                  }
                  if (activity.state) {
                    description.push(`**State**: ${Markup.escape.all(activity.state)}`);
                  }
                }
                if (activity.isOnXbox) {
                  description.push('**On Xbox**');
                }
              }
              let name = 'Activity';
              if (1 < pageLimit) {
                name = `Activity (${page} of ${pageLimit})`;
              }
              embed.addField(name, description.join('\n'), true);
            }

            // now do the fields
            const thumbnail = activity.imageUrlFormat(null, {size: 1024});
            if (thumbnail) {
              embed.setThumbnail(thumbnail);
            }
  
            const assets = activity.assets;
            if (assets && assets.smallText) {
              embed.setFooter(
                assets.smallText,
                assets.smallImageUrl || undefined,
              );
            }

            const timestamps = activity.timestamps;
            if (timestamps) {
              const elapsed = formatTime(Math.max(timestamps.elapsedTime, 0));
              const total = formatTime(timestamps.totalTime);
  
              const description = (timestamps.end) ? `${elapsed}/${total}` : `${elapsed}`;
              embed.addField('Time', description, true);
            }

            if (activity.party) {
              const group = activity.group.map((user: Structures.User) => {
                return user.mention;
              });

              const description = [];
              if (activity.party.size) {
                description.push(`${activity.partySize}/${activity.partyMaxSize} members`);
              }
              if (group.length) {
                description.push(`**Group (${group.length})**: ${group.join(', ')}`);
              }
              if (description.length) {
                embed.addField('Party', description.join('\n'));
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
                embed.addField('Store Links', Array.from(description).join(', '), true);
              }
            }

            if (activity.isOnSpotify) {
              const description = [];
              if (activity.details) {
                description.push(`[**${activity.details}**](${activity.spotifyTrackUrl})`);
              } else {
                description.push(<string> activity.spotifyTrackUrl);
              }
              embed.addField('Spotify Track', description.join('\n'), true);
            }

            if (activity.createdAt) {
              embed.setFooter('Started');
              embed.setTimestamp(activity.createdAt);
            }
          }
        } else {
          embed.addField('Activity', PresenceStatusTexts['offline']);
        }

        return embed;
      },
    });
    return await paginator.start();
  },
  onRunError,
  onTypeError,
});
