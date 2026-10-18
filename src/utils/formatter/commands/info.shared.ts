import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DiscordEmojis, PRESENCE_CLIENT_STATUS_KEYS } from '../../../constants';
import { Translator } from '../../i18n';
import {
  displayDetail,
  displayDetailsLine,
  displayTimestamp,
  getMemberJoinPosition,
  toTitleCase,
} from '../../../utils';


// shared lines for the user/users/activity info responses


// the mention with the user's badges and bot/system tag after it
export function createUserMentionLine(user: Structures.User): string {
  const parts: Array<string> = [user.mention];
  for (let key in DiscordEmojis.DISCORD_BADGES) {
    if (user.hasFlag(parseInt(key))) {
      parts.push((DiscordEmojis.DISCORD_BADGES as any)[key]);
    }
  }
  if (user.system) {
    parts.push(DiscordEmojis.DISCORD_TAG_SYSTEM);
  } else if (user.bot) {
    parts.push(DiscordEmojis.DISCORD_TAG_BOT);
  }
  return parts.join(' ');
}

// when they made their account and joined the server, with their join position
export function createUserJoinedLine(
  translator: Translator,
  user: Structures.User,
  member: Structures.Member | null,
): string {
  const { language, translate } = translator;
  const joined: Array<string> = [`${translate('user.joined_discord')} ${displayTimestamp(user.createdAtUnix)}`];
  if (member && member.joinedAtUnix) {
    let text = `${translate('user.joined_guild')} ${displayTimestamp(member.joinedAtUnix)}`;
    if (member.guild) {
      const [ position, memberCount ] = getMemberJoinPosition(member.guild, member.id);
      text += ` (${position.toLocaleString(language)}/${memberCount.toLocaleString(language)})`;
    }
    joined.push(text);
  }
  return displayDetail(translate('user.joined'), joined.join(', '));
}

// nickname, boosting, owner and voice on one line, then their roles
export function createMemberLines(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  member: Structures.Member,
): Array<string> {
  const { language, translate } = translator;
  const lines: Array<string> = [];

  const voiceChannel = member.voiceChannel;
  lines.push(displayDetailsLine([
    (member.nick) && displayDetail(translate('user.nickname'), Markup.escape.all(member.nick)),
    (member.premiumSinceUnix) && displayDetail(translate('user.boosting_since'), displayTimestamp(member.premiumSinceUnix)),
    (member.isOwner) && displayDetail(translate('common.owner'), translate('common.yes')),
    (voiceChannel) && displayDetail(translate('user.voice'), voiceChannel.toString()),
  ]));

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
        if (role.isDefault || context.guildId !== member.guildId) {
          return `\`${role.name}\``;
        }
        return role.mention;
      }
      return `<@&${role}>`;
    });

  let rolesText = displayDetail(translate('user.roles', {count: roles.length.toLocaleString(language)}), roles.join(', '));
  if (800 < rolesText.length) {
    const fromIndex = rolesText.length - ((rolesText.length - 800) + 3);
    const index = rolesText.lastIndexOf(',', fromIndex);
    rolesText = rolesText.slice(0, index) + '...';
  }
  lines.push(rolesText);

  return lines;
}

// `Online (Desktop, Web), Idle (Mobile)`, clients grouped by their status
export function createPresenceLine(translator: Translator, presence: Structures.Presence | null): string {
  const { translate, translateMaybe } = translator;
  if (!presence) {
    return displayDetail(translate('presence.status'), translate('presence.status.offline'));
  }

  const clients = new Map<string, Array<string>>();
  if (presence.clientStatus) {
    for (let key of PRESENCE_CLIENT_STATUS_KEYS) {
      const status = (presence.clientStatus as any)[key] as string | undefined;
      if (status) {
        if (!clients.has(status)) {
          clients.set(status, []);
        }
        clients.get(status)!.push(translateMaybe(`presence.client.${key}`, toTitleCase(key)));
      }
    }
  }

  let text: string;
  if (clients.size) {
    text = Array.from(clients).map(([status, names]) => `${translateMaybe(`presence.status.${status}`, status)} (${names.join(', ')})`).join(', ');
  } else {
    text = translateMaybe(`presence.status.${presence.status}`, presence.status);
  }
  return displayDetail(translate('presence.status'), text);
}

// `**Activity**: Playing Game` and its details under it
export function createActivityLines(
  translator: Translator,
  activity: Structures.PresenceActivity,
  title: string,
): Array<string> {
  const { translate, translateMaybe } = translator;
  const lines: Array<string> = [];

  let emoji: string | null = null;
  if (activity.emoji) {
    emoji = (activity.emoji.id) ? Markup.url(activity.emoji.format, activity.emoji.url) : activity.emoji.format;
  }

  if (activity.isCustomStatus) {
    const text = [emoji, (activity.state) ? Markup.escape.all(activity.state) : null].filter(Boolean).join(' ');
    lines.push(displayDetail(title, `${translate('activity.custom_status')}${(text) ? `: ${text}` : ''}`));
    if (activity.name !== 'Custom Status') {
      lines.push(displayDetail(translate('activity.hidden_message'), Markup.escape.all(activity.name || '')));
    }
  } else {
    const text = [
      translateMaybe(`activity.type.${activity.type}`, activity.typeText),
      (activity.name) ? Markup.bold(Markup.escape.all(activity.name)) : null,
      (activity.isOnSamsung) ? `(${translate('activity.on_samsung')})` : null,
      (activity.isOnXbox) ? `(${translate('activity.on_xbox')})` : null,
    ];
    lines.push(displayDetail(title, text.filter(Boolean).join(' ')));
    if (emoji) {
      lines.push(displayDetail(translate('activity.emoji'), emoji));
    }

    if (activity.isOnSpotify) {
      lines.push(displayDetailsLine([
        (activity.details) && displayDetail(translate('activity.song'), activity.details),
        (activity.state) && displayDetail(translate('activity.artists'), activity.state.split('; ').join(', ')),
        (activity.assets && activity.assets.largeText) && displayDetail(translate('activity.album'), activity.assets.largeText),
      ]));
    } else {
      lines.push(displayDetailsLine([
        (activity.details) && displayDetail(translate('activity.details'), Markup.escape.all(activity.details)),
        (activity.state) && displayDetail(translate('activity.state'), Markup.escape.all(activity.state)),
      ]));
    }
  }

  if (activity.buttons && activity.buttons.length) {
    lines.push(displayDetail(translate('activity.buttons'), activity.buttons.map((button) => Markup.codestring(button)).join(', ')));
  }
  return lines;
}
