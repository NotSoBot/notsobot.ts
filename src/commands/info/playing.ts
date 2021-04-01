import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import {
  CommandTypes,
  DateMomentLogFormat,
  DiscordEmojis,
  PresenceStatusColors,
  PresenceStatusTexts,
  PRESENCE_CLIENT_STATUS_KEYS,
} from '../../constants';
import {
  Paginator,
  Parameters,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
  getMemberJoinPosition,
  toTitleCase,
} from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
}

export interface CommandArgs {
  text: string,
}


export function activityFilter(activity: Structures.PresenceActivity, text: string): boolean {
  if (activity.name.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.state && activity.state.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.details && activity.details.toLowerCase().includes(text)) {
    return true;
  }
  if (activity.applicationId === text) {
    return true;
  }
  if (activity.application) {
    const { application } = activity;
    if (application.name.toLowerCase().includes(text)) {
      return true;
    }
    if (application.aliases && application.aliases.length) {
      return application.aliases.some((name) => {
        return name.toLowerCase().includes(text);
      });
    }
  }
  return false;
}


export const COMMAND_NAME = 'playing';

export default class PlayingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['membersplaying'],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'List users in the current server that is playing a certain game.',
        examples: [
          `${COMMAND_NAME} rust`,
          `${COMMAND_NAME} spotify`,
        ],
        type: CommandTypes.INFO,
        usage: '?<application:id|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.stringLowerCase(),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild =  context.guild as Structures.Guild;

    const presences = guild.presences.filter((presence) => {
      return presence.activities.some((activity) => activityFilter(activity, args.text));
    });
    if (presences.length) {
      const members = (presences
        .map((presence) => guild.members.get(presence.user.id))
        .filter((member) => member) as Array<Structures.Member>)
        .sort((x, y) => x.joinedAtUnix - y.joinedAtUnix);

      const pageLimit = members.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const member = members[page - 1];
          const user = member;

          const embed = createUserEmbed(user);
          embed.setColor(PresenceStatusColors['offline']);
          embed.setDescription(member.mention);
          embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));

          embed.setTitle(`User ${page} of ${pageLimit}`);
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
            if (member.joinedAtUnix) {
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

          {
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

          const presence = user.presence;
          if (presence) {
            if (presence.status in PresenceStatusColors) {
              embed.setColor(PresenceStatusColors[presence.status]);
            }

            if (presence.clientStatus) {
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

            const activity = presence.activities.find((activity) => activityFilter(activity, args.text));
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
                name = `Activity (${activity.position + 1} of ${presence.activities.length})`;
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
    return editOrReply(context, '⚠ Unable to find any members playing that game.');
  }
}
