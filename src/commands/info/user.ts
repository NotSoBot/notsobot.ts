import { Command, Constants, Structures, Utils } from 'detritus-client';
const { Permissions } = Constants;
const { Embed, Markup } = Utils;

import {
  CommandTypes,
  DateOptions,
  PresenceStatusColors,
  PresenceStatusTexts,
  PRESENCE_CLIENT_STATUS_KEYS,
} from '../../constants';
import { Paginator, Parameters, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export default class UserCommand extends BaseCommand {
  aliases = ['userinfo', 'member', 'memberinfo'];
  name = 'user';

  label = 'user';
  metadata = {
    description: 'Get information about a user, defaults to self',
    examples: [
      'user',
      'user cake',
      'user cake#1',
      'user <@439205512425504771>',
    ],
    type: CommandTypes.INFO,
    usage: 'user ?<id|mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  type = Parameters.memberOrUserOrCurrent();

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const isMember = (args.user instanceof Structures.Member);
    const member = <Structures.Member> args.user;
    const user = <Structures.User> args.user;

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
        const embed = new Embed();
        embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 1024}), user.jumpLink);
        embed.setColor(PresenceStatusColors['offline']);
        embed.setDescription(user.mention);
        embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));

        {
          const description: Array<string> = [];
          description.push(`**Id**: \`${user.id}\``);
          description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
          if (user.system) {
            description.push(`**System**: Yes`);
          }
          if (user.system) {
            description.push('**Tag**: <:system1:649406724960157708><:system2:649406733613269002>');
          } else if (user.bot) {
            description.push('**Tag**: <:bot1:649407239060455426><:bot2:649407247033565215>');
          }
          embed.addField('Information', description.join('\n'), true);
        }

        {
          const description: Array<string> = [];
          description.push(`**Discord**: ${user.createdAt.toLocaleString('en-US', DateOptions)}`);
          if (isMember && member.joinedAt) {
            description.push(`**Guild**: ${member.joinedAt.toLocaleString('en-US', DateOptions)}`);
            if (member.guild) {
              const position = member.guild.members.sort((x, y) => x.joinedAtUnix - y.joinedAtUnix).findIndex((m) => m.id === member.id) + 1;
              description.push(`**Join Position**: ${position.toLocaleString()}/${member.guild.members.length.toLocaleString()}`);
            }
          }
          embed.addField('Joined', description.join('\n'), true);
        }

        if (isMember) {
          const description: Array<string> = [];

          if (member.premiumSince) {
            description.push(`**Boosting Since**: ${member.premiumSince.toLocaleString('en-US', DateOptions)}`);
          }
          if (member.nick) {
            description.push(`**Nickname**: ${member.nick}`);
          }
          if (member.isOwner) {
            description.push('**Owner**: Yes');
          }

          const roles = member.roles
            .map((role, roleId) => role || roleId)
            .sort((x: Structures.Role | string, y: Structures.Role | string) => {
              if (x instanceof Structures.Role && y instanceof Structures.Role) {
                return x.position - y.position;
              }
              return 0;
            })
            .map((role: Structures.Role | string) => {
              if (role instanceof Structures.Role) {
                if ((role.isDefault || context.guildId !== member.guildId) && role) {
                  return `\`${role.name}\``;
                }
                return role.mention;
              }
              return `<@&${role}>`;
            });

          let rolesText = `**Roles (${roles.length})**: ${roles.join(', ')}`;
          if (800 < rolesText.length) {
            const fromIndex = rolesText.length - ((rolesText.length - 800) + 3);
            const index = rolesText.lastIndexOf(',', fromIndex);
            rolesText = rolesText.slice(0, index) + '...';
          }
          description.push(rolesText);

          const voiceChannel = member.voiceChannel;
          if (voiceChannel) {
            description.push(`**Voice**: ${voiceChannel.toString()}`);
          }
          embed.addField('Guild Specific', description.join('\n'));
        }

        if (presence) {
          if (presence.status in PresenceStatusColors) {
            embed.setColor(PresenceStatusColors[presence.status]);
          }

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

          const activityId = page - 1;
          if (activityId in activities) {
            const activity = activities[activityId];

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
              if (activity.state) {
                description.push(`**Custom Status**: ${Markup.escape.all(activity.state)}`);
              } else {
                description.push(`**Custom Status**`);
              }
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
              if (activity.isOnSamsung) {
                description.push(`**On Samsung Galaxy**`);
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
        } else {
          embed.addField('Activity', PresenceStatusTexts['offline']);
        }
        return embed;
      },
    });
    return await paginator.start();
  }
}
