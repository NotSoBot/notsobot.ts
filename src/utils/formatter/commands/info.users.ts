import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import {
  DateMomentLogFormat,
  DiscordEmojis,
  PRESENCE_CLIENT_STATUS_KEYS,
  PresenceStatusColors,
  StatusEmojis,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  createTimestampMomentFromGuild,
  displayReply,
  getMemberJoinPosition,
  toTitleCase,
} from '../../../utils';


export interface CommandArgsBefore {
  bots: boolean,
  hasnick: boolean,
  role?: Structures.Role,
  users: Array<Structures.Member | Structures.User>,
}

export interface CommandArgs {
  bots: boolean,
  hasnick: boolean,
  role?: Structures.Role,
  users: Array<Structures.Member | Structures.User>,
}


export const COMMAND_ID = 'users';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { users } = args;

  let membersOrUsers = users;
  if (args.bots) {
    membersOrUsers = membersOrUsers.filter((memberOrUser) => memberOrUser.bot);
  }
  if (args.hasnick || args.role) {
    membersOrUsers = membersOrUsers.filter((memberOrUser) => {
      if (memberOrUser instanceof Structures.Member) {
        if (args.hasnick && !memberOrUser.nick) {
          return false;
        }
        if (args.role && !memberOrUser.roles.has(args.role.id)) {
          return false;
        }
        return true;
      }
      return false;
    });
  }
  membersOrUsers = membersOrUsers.sort((x, y) => {
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
  if (pageLimit === 0) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('info.users.not_found')}`});
  }

  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const position = page - 1;
      if (!(position in membersOrUsers)) {
        throw new Error('lol');
      }
      const memberOrUser = membersOrUsers[position];

      const isMember = (memberOrUser instanceof Structures.Member);
      const member = memberOrUser as Structures.Member;
      const user = ((isMember) ? member.user : memberOrUser) as Structures.User;

      const payload: DisplayPayload = {fields: []};
      payload.title = user.toString();
      payload.url = user.jumpLink;
      payload.color = PresenceStatusColors['offline'];
      payload.description = member.mention;
      payload.thumbnail = member.avatarUrlFormat(null, {size: 1024});

      payload.footer = translate('user.page', {page: page.toLocaleString(language), total: pageLimit.toLocaleString(language)});
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
            description.push(`**${translate('user.badges')}**: ${badges.join(' ')}`);
          }
        }
        description.push(`**${translate('user.bot')}**: ${translate((user.bot) ? 'common.yes' : 'common.no')}`);
        description.push(`**${translate('common.id')}**: \`${user.id}\``);
        if (user.system) {
          description.push(`**${translate('user.system')}**: ${translate('common.yes')}`);
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
            description.push(`**${translate('user.tag')}**: ${tag}`);
          }
        }
        payload.fields!.push({inline: true, name: translate('common.information'), value: description.join('\n')});
      }

      {
        const description: Array<string> = [];
        {
          const timestamp = createTimestampMomentFromGuild(user.createdAtUnix, context.guildId);
          description.push(`**${translate('user.joined_discord')}**: ${timestamp.locale(language).fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (isMember && member.joinedAtUnix) {
          {
            const timestamp = createTimestampMomentFromGuild(member.joinedAtUnix, context.guildId);
            description.push(`**${translate('user.joined_guild')}**: ${timestamp.locale(language).fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }
          if (member.guild) {
            const [ position, memberCount ] = getMemberJoinPosition(member.guild, member.id);
            description.push(`**${translate('user.join_position')}**: ${position.toLocaleString(language)}/${memberCount.toLocaleString(language)}`);
          }
        }
        payload.fields!.push({inline: true, name: translate('user.joined'), value: description.join('\n')});
      }

      if (isMember) {
        const description: Array<string> = [];

        if (member.premiumSince) {
          const timestamp = createTimestampMomentFromGuild(member.premiumSinceUnix, context.guildId);
          description.push(`**${translate('user.boosting_since')}**: ${timestamp.locale(language).fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (member.nick) {
          description.push(`**${translate('user.nickname')}**: ${member.nick}`);
        }
        if (member.isOwner) {
          description.push(`**${translate('common.owner')}**: ${translate('common.yes')}`);
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

        let rolesText = `**${translate('user.roles', {count: roles.length.toLocaleString(language)})}**: ${roles.join(', ')}`;
        if (800 < rolesText.length) {
          const fromIndex = rolesText.length - ((rolesText.length - 800) + 3);
          const index = rolesText.lastIndexOf(',', fromIndex);
          rolesText = rolesText.slice(0, index) + '...';
        }
        description.push(rolesText);

        const voiceChannel = member.voiceChannel;
        if (voiceChannel) {
          description.push(`**${translate('user.voice')}**: ${voiceChannel.toString()}`);
        }
        payload.fields!.push({name: translate('user.guild_specific'), value: description.join('\n')});
      }

      const presence = user.presence;
      if (presence) {
        if (presence.status in PresenceStatusColors) {
          payload.color = PresenceStatusColors[presence.status];
        }

        if (presence.clientStatus && Object.keys(presence.clientStatus).length) {
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

        const activity = presence.activity;
        if (activity) {
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
          if (presence.activities.length !== 1) {
            name = translate('activity.title_paged', {page: 1, total: presence.activities.length});
          }
          payload.fields!.push({inline: true, name: name, value: description.join('\n')});
        }
      } else {
        payload.fields!.push({name: translate('activity.title'), value: translate('presence.status.offline')});
      }

      if (isMember) {
        if (member.avatar) {
          const description: Array<string> = [];

          description.push(Markup.url(Markup.bold(translate('user.guild_avatar')), member.avatarUrl));
          description.push(Markup.url(Markup.bold(translate('user.user_avatar')), user.avatarUrl));

          payload.fields!.push({name: translate('common.urls'), value: description.join(', ')});
        }
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}
