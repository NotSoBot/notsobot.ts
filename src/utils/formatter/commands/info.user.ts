import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import UserAvatarDecorations, { UserAvatarDecorationStored } from '../../../stores/useravatardecorations';

import { utilitiesFetchMedia } from '../../../api';
import {
  DateMomentLogFormat,
  DiscordEmojis,
  PRESENCE_CLIENT_STATUS_KEYS,
  PresenceStatusColors,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  createTimestampMomentFromContext,
  getMemberJoinPosition,
  jobWaitForResponse,
  toTitleCase,
} from '../../../utils';


export const COMMAND_ID = 'info.user';

export const RESULTS_PER_PAGE = 3;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {isEphemeral?: boolean, user: Structures.Member | Structures.User | Structures.UserWithBanner},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const isMember = (args.user instanceof Structures.Member);
  const member = args.user as Structures.Member;
  const user = ((isMember) ? member.user : args.user) as Structures.User;
  const userWithBanner = (args.user instanceof Structures.UserWithBanner) ? args.user : await context.rest.fetchUser(user.id);

  let avatarDecorationServer: UserAvatarDecorationStored | null = null;
  let avatarDecorationUser: UserAvatarDecorationStored | null = null;

  if (isMember) {
    if (member.avatarDecorationData) {
      avatarDecorationServer = await UserAvatarDecorations.getOrFetch(
        context.client,
        member.avatarDecorationData.skuId,
        member.avatarDecorationData.asset,
      );
    }
    if (member.user.avatarDecorationData) {
      avatarDecorationUser = await UserAvatarDecorations.getOrFetch(
        context.client,
        member.user.avatarDecorationData.skuId,
        member.user.avatarDecorationData.asset,
      );
    }
  } else {
    if (args.user.avatarDecorationData) {
      avatarDecorationUser = await UserAvatarDecorations.getOrFetch(
        context.client,
        args.user.avatarDecorationData.skuId,
        args.user.avatarDecorationData.asset,
      );
    }
  }

  const files: Array<RequestTypes.File> = [];

  const avatarUrl = member.avatarUrlFormat(null, {size: 1024});
  try {
    const maxFileSize = (context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
    const response = await utilitiesFetchMedia(context, {
      maxFileSize,
      url: avatarUrl,
    }).then((x) => jobWaitForResponse(context, x));
    files.push({
      filename: response.file.filename,
      value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0),
    });
  } catch(error) {

  }

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
    isEphemeral: args.isEphemeral,
    onPage: async (page) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = PresenceStatusColors['offline'];
      payload.description = user.mention;
      payload.title = user.toString();
      payload.url = user.jumpLink;

      if (files.length) {
        const file = files[0]!;
        payload.thumbnail = `attachment://${file.filename}`;
      } else {
        payload.thumbnail = avatarUrl;
      }

      {
        const description: Array<string> = [];
        if (avatarDecorationServer) {
          description.push(`**${translate('user.avatar_decoration_server')}**: ${Markup.url(avatarDecorationServer.name, avatarDecorationServer.url)}`); 
        }
        if (avatarDecorationUser) {
          description.push(`**${translate('user.avatar_decoration_user')}**: ${Markup.url(avatarDecorationUser.name, avatarDecorationUser.url)}`); 
        }
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

        if (userWithBanner.accentColor !== null) {
          const color = intToRGB(userWithBanner.accentColor);
          const hex = Markup.codestring(intToHex(userWithBanner.accentColor, true));
          const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
          description.push(`**${translate('user.banner_color')}**: ${hex} ${rgb}`);
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
          const timestamp = createTimestampMomentFromContext(user.createdAtUnix, context);
          description.push(`**${translate('user.joined_discord')}**: ${timestamp.locale(language).fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (isMember && member.joinedAtUnix) {
          {
            const timestamp = createTimestampMomentFromContext(member.joinedAtUnix, context);
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

        if (member.premiumSinceUnix) {
          const timestamp = createTimestampMomentFromContext(member.premiumSinceUnix, context);
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

        const activityId = page - 1;
        if (activityId in activities) {
          const activity = activities[activityId];

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
      } else {
        payload.fields!.push({name: translate('activity.title'), value: translate('presence.status.offline')});
      }

      {
        const description: Array<string> = [];

        if (isMember) {
          if (member.avatar) {
            description.push(Markup.url(Markup.bold(translate('user.guild_avatar')), member.avatarUrl));
          }
        }

        if (userWithBanner.banner) {
          payload.image = userWithBanner.bannerUrl!;
          description.push(Markup.url(Markup.bold(translate('user.user_banner')), userWithBanner.bannerUrlFormat(null, {size: 512})!));
        }

        if (description.length) {
          description.push(Markup.url(Markup.bold(translate('user.user_avatar')), user.avatarUrl));
          payload.fields!.push({name: translate('common.urls'), value: description.sort().join(', ')});
        }
      }

      return {display: {...payload, files}};
    },
  });
  return await paginator.start();
}
