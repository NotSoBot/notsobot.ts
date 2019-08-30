import { URLSearchParams } from 'url';

import { Command, Structures, Utils } from 'detritus-client';

import {
  PresenceStatusColors,
  PresenceStatusTexts,
} from '../constants';
import { Paginator, Parameters, toTitleCase } from '../utils';


export default (<Command.CommandOptions> {
  name: 'user',
  aliases: ['userinfo', 'member', 'memberinfo'],
  args: [{default: 1, name: 'id', type: 'number'}],
  label: 'user',
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
  run: async (context, args) => {
    const isMember = (args.user instanceof Structures.Member);
    const member = <Structures.Member> args.user;
    const user = <Structures.User> args.user;

    const presence = user.presence;
    const activities = (presence) ? presence.activities.toArray() : [];
    const pageLimit = activities.length || 1;

    const paginator = new Paginator(context, {
      page: Math.max(1, Math.min(args.id, pageLimit)),
      pageLimit,
      onPage: (page) => {
        const embed = new Utils.Embed();
        embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 1024}), user.jumpLink);
        embed.setColor(PresenceStatusColors['offline']);
        embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));

        embed.addField('Information', [
          `**Id**: \`${user.id}\``,
          `**Bot**: ${(user.bot) ? 'Yes' : 'No'}`,
        ].join('\n'), true);

        const dateOptions = {
          hour12: false,
          timeZone: 'America/New_York',
        };
        embed.addField('Joined', [
          `**Discord**: ${user.createdAt.toLocaleString('en-US', dateOptions)}`,
          (isMember) ? `**Guild**: ${member.joinedAt.toLocaleString('en-US', dateOptions)}` : null,
        ].filter((v) => v).join('\n'), true);

        if (isMember) {
          const roles = member.roles.map((role, roleId) => {
            return (role) ? `\`${role.name}\`` : `<@${roleId}>`;
          });
          const voiceChannel = member.voiceChannel;
          embed.addField('Guild Specific', [
            (member.premiumSince) ? `**Boosting Since**: ${member.premiumSince.toLocaleString('en-US', dateOptions)}` : null,
            (member.nick) ? `**Nickname**: ${member.nick}` : null,
            (member.isOwner) ? '**Owner**: Yes' : null,
            `**Roles (${member.roles.length})**: ${roles.join(', ')}`,
            (voiceChannel) ? `**Voice**: ${voiceChannel.toString()}` : null,
          ].filter((v) => v).join('\n'));
        }

        if (presence) {
          if (presence.status in PresenceStatusColors) {
            embed.setColor(PresenceStatusColors[presence.status]);
          }

          if (presence.clientStatus) {
            const description = [];
            for (let key of Object.keys(presence.clientStatus).sort()) {
              let status = (<any> presence.clientStatus)[key];
              if (status in PresenceStatusTexts) {
                status = PresenceStatusTexts[status];
              }
              description.push(`**${toTitleCase(key)}**: ${status}`);
            }
            embed.addField('Status', description.join('\n'));
          } else {
            let status = presence.status;
            if (status in PresenceStatusTexts) {
              status = PresenceStatusTexts[status];
            }
            embed.addField('Status', status, true);
          }

          const activityId = page - 1;
          if (activityId in activities) {
            const activity = activities[activityId];
            if (activity) {
              const description = [];
              if (activity.isCustomStatus) {
                description.push(`Custom Status: ${activity.state}`);

                if (activity.details) {
                  try {
                    const details = new URLSearchParams(activity.details);
                    const channelId = details.get('c') || '';
                    if (context.channels.has(channelId)) {
                      const channel = <Structures.Channel> context.channels.get(channelId);
                      if (channel.isGuildVoice) {
                        description.push(`In Voice: ${channel.mention} (${channel.id})`);
                      }
                    }
                  } catch(error) {

                  }
                }
              } else {
                const text = [activity.typeText, activity.name];
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
                    description.push(`**Details**: ${activity.details}`);
                  }
                  if (activity.state) {
                    description.push(`**State**: ${activity.state}`);
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
          }
        } else {
          embed.addField('Activity', PresenceStatusTexts['offline']);
        }
        return embed;
      },
    });
    await paginator.start();
  },
});
