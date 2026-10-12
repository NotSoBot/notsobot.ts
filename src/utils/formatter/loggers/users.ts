import { UserFlags as DiscordUserFlags, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { DiscordUserFlagsText, EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed } from '../../../utils';

import {
  addContainerBody,
  addContainerFooter,
  addContainerGallery,
  addContainerHeader,
  addImageFiles,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventUsersUpdate } from './types';


export function getUsersUpdateChanges(event: GuildLoggingEventUsersUpdate): Array<string> {
  const { avatarDecorations, old, user } = event.cached;
  const { differences } = event.payload;

  const description: Array<string> = [];
  if (!differences) {
    return description;
  }

  if (differences.avatar !== undefined) {
    if (differences.avatar && user.avatar) {
      description.push('- Changed Avatars');
    } else if (differences.avatar && !user.avatar) {
      description.push('- Removed Avatar');
    } else if (!differences.avatar && user.avatar) {
      description.push('- Changed from the default Avatar');
    }
  }
  if (differences.avatarDecorationData !== undefined) {
    const newUrl = avatarDecorations && avatarDecorations.current && Markup.url(avatarDecorations.current.name, avatarDecorations.current.url);
    const oldUrl = avatarDecorations && avatarDecorations.old && Markup.url(avatarDecorations.old.name, avatarDecorations.old.url);

    if (old.avatarDecorationData && user.avatarDecorationData) {
      description.push('- Changed Avatar Decorations');
      description.push(`-> From **${oldUrl}** to **${newUrl}**`);
    } else if (old.avatarDecorationData && !user.avatarDecorationData) {
      description.push('- Removed Avatar Decoration');
      description.push(`-> Removed **${oldUrl}**`);
    } else if (!differences.avatarDecorationData && user.avatarDecorationData) {
      description.push('- Set Avatar Decoration');
      description.push(`-> Set to **${newUrl}**`);
    }
  }
  if (differences.username !== undefined || differences.discriminator !== undefined) {
    if (differences.username !== undefined) {
      description.push('- Username Change');
      description.push(`-> **${Markup.codestring(differences.username)}** to **${Markup.codestring(user.username)}**`);
    }
    if (differences.discriminator !== undefined) {
      description.push('- Discriminator Change');
      description.push(`-> **${Markup.codestring(differences.discriminator)}** to **${Markup.codestring(user.discriminator)}**`);
    }
  }
  if (differences.clan !== undefined) {
    const oldTag = differences.clan && differences.clan.tag;
    const newTag = user.clan && user.clan.tag;
    if (oldTag !== newTag) {
      description.push('- Clan Tag Change');
      if (oldTag && newTag) {
        description.push(`-> **${Markup.codestring(oldTag)}** to **${Markup.codestring(newTag)}**`);
      } else if (oldTag && !newTag) {
        description.push(`-> Removed **${Markup.codestring(oldTag)}**`);
      } else if (!oldTag && newTag) {
        description.push(`-> Changed to **${Markup.codestring(newTag)}**`);
      }
    }
  }
  if (differences.globalName !== undefined) {
    description.push('- Global Name Change');
    if (differences.globalName && user.globalName) {
      description.push(`-> **${Markup.codestring(differences.globalName)}** to **${Markup.codestring(user.globalName)}**`);
    } else if (differences.globalName && !user.globalName) {
      description.push(`-> Removed **${Markup.codestring(differences.globalName)}**`);
    } else if (!differences.globalName && user.globalName) {
      description.push(`-> Changed to **${Markup.codestring(user.globalName)}**`);
    }
  }
  if (differences.publicFlags !== undefined) {
    const added: Array<string> = [];
    const removed: Array<string> = [];
    for (let key in DiscordUserFlagsText) {
      const flag = parseInt(key) as DiscordUserFlags;
      const oldHas = old.hasFlag(flag);
      const newHas = user.hasFlag(flag);
      if (oldHas && !newHas) {
        removed.push(`**${Markup.codestring(DiscordUserFlagsText[flag])}**`);
      } else if (!oldHas && newHas) {
        added.push(`**${Markup.codestring(DiscordUserFlagsText[flag])}**`);
      }
    }

    description.push('- Badges');
    if (removed.length) {
      description.push(`-> Removed ${removed.join(', ')}`);
    }
    if (added.length) {
      description.push(`-> Added ${added.join(', ')}`);
    }
  }

  return description;
}


export function formatUsersUpdate(
  event: GuildLoggingEventUsersUpdate,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, user } = event.cached;
  const { differences } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`User Updated • ${timestamp}`);
  }

  createUserEmbed(user, embed);
  embed.setColor(EmbedColors.LOG_UPDATE);

  if (avatars) {
    const guild = shard.guilds.get(guildId);
    const maxFileSize = (guild) ? guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;

    const urls = addImageFiles(files, avatars, maxFileSize);
    if (urls.current) {
      embed.setAuthor(undefined, urls.current);
    }
    if (urls.old) {
      embed.setThumbnail(urls.old);
    }
  }

  embed.setDescription(user.mention);
  if (differences) {
    embed.addField('Changes', getUsersUpdateChanges(event).join('\n'));
  }
}


export function formatUsersUpdateComponents(
  event: GuildLoggingEventUsersUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, user } = event.cached;

  let urls: {current?: string, old?: string} = {};
  if (avatars) {
    const guild = shard.guilds.get(guildId);
    const maxFileSize = (guild) ? guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
    urls = addImageFiles(files, avatars, maxFileSize);
  }

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(container, createUserHeaderLines(user.id, user), urls.current || user.avatarUrlFormat(null, {size: 1024}));
  addContainerBody(container, [{title: 'Changes', lines: getUsersUpdateChanges(event)}]);

  if (urls.old) {
    const images = [{description: 'Old Avatar', url: urls.old}];
    if (urls.current) {
      images.push({description: 'New Avatar', url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? 'Avatar (Old -> New)' : 'Old Avatar');
  }

  addContainerFooter(container, `User Updated • ${createTimestampStringFromGuild(happened, guildId)}`);
}
