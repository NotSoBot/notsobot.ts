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
  users: Array<Structures.Member | Structures.User>,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}

export default class UsersCommand extends BaseCommand {
  aliases = ['members'];
  name = 'users';

  label = 'users';
  metadata = {
    description: 'Get information about multiple members/users',
    examples: [
      'users',
      'users cake',
      'users cake#1',
      'users <@300505364032389122> <@439205512425504771>',
    ],
    type: CommandTypes.INFO,
    usage: 'users ...?<id|mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  type = Parameters.membersOrUsersOrAll();

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.users.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find any members matching that.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { users } = args;

    const membersOrUsers = users.sort((x, y) => {
      if (x instanceof Structures.Member && y instanceof Structures.Member) {
        return x.joinedAtUnix - y.joinedAtUnix;
      } else if (x instanceof Structures.Member) {
        return x.joinedAtUnix - 0;
      } else if (y instanceof Structures.Member) {
        return 0 - y.joinedAtUnix;
      }
      return 0;
    });

    const pageLimit = membersOrUsers.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const position = page - 1;
        if (!(position in membersOrUsers)) {
          throw new Error('lol');
        }

        const isMember = (membersOrUsers[position] instanceof Structures.Member);
        const member = <Structures.Member> membersOrUsers[position];
        const user = <Structures.User> membersOrUsers[position];

        const embed = new Embed();
        embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 1024}), user.jumpLink);
        embed.setColor(PresenceStatusColors['offline']);
        embed.setDescription(member.mention);
        embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));

        embed.setTitle(`User ${page} of ${pageLimit}`);
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

        const presence = user.presence;
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

          const activity = presence.activity;
          if (activity) {
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
            if (presence.activities.length !== 1) {
              name = `Activity (1 of ${presence.activities.length})`;
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
