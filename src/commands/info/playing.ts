import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import {
  CommandTypes,
  DateOptions,
  PresenceStatusColors,
  PresenceStatusTexts,
  PRESENCE_CLIENT_STATUS_KEYS,
} from '../../constants';
import { Paginator, Parameters, createUserEmbed, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  applications: Array<Structures.Application>,
}

export interface CommandArgs {
  applications: Array<Structures.Application>,
}


export const COMMAND_NAME = 'playing';

export default class PlayingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['membersplaying'],
      disableDm: true,
      label: 'applications',
      metadata: {
        description: 'List users in the current server that is playing a certain game.',
        examples: [
          `${COMMAND_NAME} rust`,
          `${COMMAND_NAME} 356888738724446208`,
        ],
        type: CommandTypes.INFO,
        usage: `${COMMAND_NAME} ?<application:id|name>`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.applications,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.applications.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that game.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { applications } = args;
    const [ application ] = applications as [Structures.Application];
    const guild =  context.guild as Structures.Guild;

    const presences = guild.presences.filter((presence) => {
      return presence.activities.some((activity) => activity.applicationId === application.id || activity.name === application.name);
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
            if (member.joinedAt) {
              description.push(`**Guild**: ${member.joinedAt.toLocaleString('en-US', DateOptions)}`);
              if (member.guild) {
                const position = member.guild.members.sort((x, y) => x.joinedAtUnix - y.joinedAtUnix).findIndex((m) => m.id === member.id) + 1;
                description.push(`**Join Position**: ${position.toLocaleString()}/${member.guild.members.length.toLocaleString()}`);
              }
            }
            embed.addField('Joined', description.join('\n'), true);
          }

          {
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
    return context.editOrReply('⚠ Unable to find any members playing that game.');
  }
}
