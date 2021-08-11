import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import {
  CommandTypes,
  DateMomentLogFormat,
  DiscordEmojis,
  PresenceStatusColors,
  PresenceStatusTexts,
  PRESENCE_CLIENT_STATUS_KEYS,
} from '../../../constants';
import {
  DefaultParameters,
  Paginator,
  Parameters,
  createTimestampMomentFromGuild,
  editOrReply,
  getMemberJoinPosition,
  toTitleCase,
} from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


export const COMMAND_NAME = 'user';

export default class UserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['userinfo', 'member', 'memberinfo'],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        description: 'Get information about a user, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        type: CommandTypes.INFO,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const isMember = (args.user instanceof Structures.Member);
    const member = args.user as Structures.Member;
    const user = ((isMember) ? member.user : args.user) as Structures.User;

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

        embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));

        {
          const description: Array<string> = [];
          {
            const badges: Array<string> = [];
            for (let key in DiscordEmojis.DISCORD_BADGES) {
              if (user.hasFlag(parseInt(key))) {
                badges.push((DiscordEmojis.DISCORD_BADGES as any)[key]);
              }
            }
            if (badges.length) {
              description.push(`**Badges**: ${badges.join(' ')}`);
            }
          }
          description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
          description.push(`**Id**: \`${user.id}\``);
          if (user.system) {
            description.push(`**System**: Yes`);
          }
          {
            let tag: string | undefined;
            if (user.system) {
              tag = DiscordEmojis.DISCORD_TAG_SYSTEM;
            } else if (user.bot) {
              if (user.hasVerifiedBot) {
                tag = DiscordEmojis.DISCORD_TAG_BOT
              } else {
                tag = DiscordEmojis.DISCORD_TAG_BOT;
              }
            }
            if (tag) {
              description.push(`**Tag**: ${tag}`);
            }
          }
          embed.addField('Information', description.join('\n'), true);
        }

        {
          const description: Array<string> = [];
          {
            const timestamp = createTimestampMomentFromGuild(user.createdAtUnix, context.guildId);
            description.push(`**Discord**: ${timestamp.fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }
          if (isMember && member.joinedAtUnix) {
            {
              const timestamp = createTimestampMomentFromGuild(member.joinedAtUnix, context.guildId);
              description.push(`**Guild**: ${timestamp.fromNow()}`);
              description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
            }

            if (member.guild) {
              const [ position, memberCount ] = getMemberJoinPosition(member.guild, member.id);
              description.push(`**Join Position**: ${position.toLocaleString()}/${memberCount.toLocaleString()}`);
            }
          }
          embed.addField('Joined', description.join('\n'), true);
        }

        if (isMember) {
          const description: Array<string> = [];

          if (member.premiumSinceUnix) {
            const timestamp = createTimestampMomentFromGuild(member.premiumSinceUnix, context.guildId);
            description.push(`**Boosting Since**: ${timestamp.fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
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

          if (presence.clientStatus && Object.keys(presence.clientStatus).length) {
            const description = [];
            for (let key of PRESENCE_CLIENT_STATUS_KEYS) {
              let status = (presence.clientStatus as any)[key];
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
            if (activity.buttons && activity.buttons.length) {
              description.push(`**Buttons**: ${activity.buttons.map((button) => Markup.codestring(button)).join(', ')}`);
            }
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

        if (isMember) {
          if (member.avatar) {
            const description: Array<string> = [];

            description.push(Markup.url(Markup.bold('Guild Avatar'), member.avatarUrl));
            description.push(Markup.url(Markup.bold('User Avatar'), user.avatarUrl));

            embed.addField('Urls', description.join(', '));
          }
        }

        return embed;
      },
    });
    return await paginator.start();
  }
}
