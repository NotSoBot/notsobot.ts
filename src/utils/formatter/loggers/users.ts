import { UserFlags as DiscordUserFlags, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { DiscordUserFlagsText, EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed } from '../../../utils';

import type { Translator } from '../../i18n';
import {
  addContainerFooter,
  addContainerGallery,
  addContainerHeader,
  addImageFiles,
  createUserHeaderLines,
} from './tools';
import { LogPayloadFiles, GuildLoggingEventUsersUpdate } from './types';


export function getUsersUpdateChanges(event: GuildLoggingEventUsersUpdate, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const { avatarDecorations, old, user } = event.cached;
  const { differences } = event.payload;

  const description: Array<string> = [];
  if (!differences) {
    return description;
  }

  if (differences.avatar !== undefined) {
    if (differences.avatar && user.avatar) {
      description.push(`- ${translate('logger.user.avatar_changed')}`);
    } else if (differences.avatar && !user.avatar) {
      description.push(`- ${translate('logger.user.avatar_removed')}`);
    } else if (!differences.avatar && user.avatar) {
      description.push(`- ${translate('logger.user.avatar_from_default')}`);
    }
  }
  if (differences.avatarDecorationData !== undefined) {
    const newUrl = avatarDecorations && avatarDecorations.current && Markup.url(avatarDecorations.current.name, avatarDecorations.current.url);
    const oldUrl = avatarDecorations && avatarDecorations.old && Markup.url(avatarDecorations.old.name, avatarDecorations.old.url);

    if (old.avatarDecorationData && user.avatarDecorationData) {
      description.push(`- ${translate('logger.user.decoration_changed')}`);
      description.push(`-> ${translate('logger.from_to', {old: `**${oldUrl}**`, new: `**${newUrl}**`})}`);
    } else if (old.avatarDecorationData && !user.avatarDecorationData) {
      description.push(`- ${translate('logger.user.decoration_removed')}`);
      description.push(`-> ${translate('logger.removed', {value: `**${oldUrl}**`})}`);
    } else if (!differences.avatarDecorationData && user.avatarDecorationData) {
      description.push(`- ${translate('logger.user.decoration_set')}`);
      description.push(`-> ${translate('logger.set_to', {value: `**${newUrl}**`})}`);
    }
  }
  if (differences.username !== undefined || differences.discriminator !== undefined) {
    if (differences.username !== undefined) {
      description.push(`- ${translate('logger.user.username_change')}`);
      description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(differences.username)}**`, new: `**${Markup.codestring(user.username)}**`})}`);
    }
    if (differences.discriminator !== undefined) {
      description.push(`- ${translate('logger.user.discriminator_change')}`);
      description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(differences.discriminator)}**`, new: `**${Markup.codestring(user.discriminator)}**`})}`);
    }
  }
  if (differences.clan !== undefined) {
    // differences.clan is a partial object of the changed keys when both old and new clans exist, so compare the structures instead
    const oldTag = old.clan && old.clan.tag;
    const newTag = user.clan && user.clan.tag;
    if (oldTag !== newTag) {
      description.push(`- ${translate('logger.user.clan_tag_change')}`);
      if (oldTag && newTag) {
        description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(oldTag)}**`, new: `**${Markup.codestring(newTag)}**`})}`);
      } else if (oldTag && !newTag) {
        description.push(`-> ${translate('logger.removed', {value: `**${Markup.codestring(oldTag)}**`})}`);
      } else if (!oldTag && newTag) {
        description.push(`-> ${translate('logger.changed_to', {value: `**${Markup.codestring(newTag)}**`})}`);
      }
    }
  }
  if (differences.globalName !== undefined) {
    description.push(`- ${translate('logger.user.global_name_change')}`);
    if (differences.globalName && user.globalName) {
      description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(differences.globalName)}**`, new: `**${Markup.codestring(user.globalName)}**`})}`);
    } else if (differences.globalName && !user.globalName) {
      description.push(`-> ${translate('logger.removed', {value: `**${Markup.codestring(differences.globalName)}**`})}`);
    } else if (!differences.globalName && user.globalName) {
      description.push(`-> ${translate('logger.changed_to', {value: `**${Markup.codestring(user.globalName)}**`})}`);
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
        removed.push(`**${Markup.codestring(translator.label('badges', DiscordUserFlagsText[flag]))}**`);
      } else if (!oldHas && newHas) {
        added.push(`**${Markup.codestring(translator.label('badges', DiscordUserFlagsText[flag]))}**`);
      }
    }

    description.push(`- ${translate('user.badges')}`);
    if (removed.length) {
      description.push(`-> ${translate('logger.removed', {value: `${removed.join(', ')}`})}`);
    }
    if (added.length) {
      description.push(`-> ${translate('logger.added', {value: `${added.join(', ')}`})}`);
    }
  }

  return description;
}


export function formatUsersUpdate(
  event: GuildLoggingEventUsersUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { guildId, happened } = event;
  const { shard } = event.payload;

  const { avatars, user } = event.cached;
  const { differences } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.user_updated')} • ${timestamp}`);
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
    embed.addField(translate('logger.changes'), getUsersUpdateChanges(event, translator).join('\n'));
  }
}


export function formatUsersUpdateComponents(
  event: GuildLoggingEventUsersUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
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
  // the changes go next to the avatar thumbnail, the footer adds the divider so there's no body
  addContainerHeader(
    container,
    createUserHeaderLines(user.id, user, translator),
    urls.current || user.avatarUrlFormat(null, {size: 1024}),
    false,
    [{title: translate('logger.changes'), lines: getUsersUpdateChanges(event, translator)}],
  );

  if (urls.old) {
    const images = [{description: translate('logger.user.old_avatar'), url: urls.old}];
    if (urls.current) {
      images.push({description: translate('logger.user.new_avatar'), url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? translate('logger.user.avatar_old_new') : translate('logger.user.old_avatar'));
  }

  addContainerFooter(container, `${translate('logger.footer.user_updated')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}
