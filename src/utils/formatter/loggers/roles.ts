import { Structures } from 'detritus-client';
import { ComponentContainer, Embed, Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors, PermissionsText, StatusEmojis } from '../../../constants';
import { createColorUrl, createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserString, permissionsToObject } from '../../../utils';

import type { Translator } from '../../i18n';
import { ContainerSection, addContainerBody, addContainerFooter, addContainerGallery, addContainerHeader, hasContainerSections } from './tools';
import {
  GuildLoggingEventItemAudits,
  LogPayloadFiles,
  GuildLoggingEventGuildRoleCreate,
  GuildLoggingEventGuildRoleDelete,
  GuildLoggingEventGuildRoleUpdate,
} from './types';


export function getRoleModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;
    description.push(`**${byText}**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
  }
  return description;
}


export function getRoleColorText(color: number): string {
  const rgb = intToRGB(color);
  const hex = Markup.codestring(intToHex(color, true));
  return `${hex} ${Markup.codestring(`(${rgb.r}, ${rgb.g}, ${rgb.b})`)}`;
}


// components use discord's relative timestamp, it stays accurate and shows the full date on hover
export function getRoleInformationLines(
  role: Structures.Role,
  guildId: string,
  showCreated: boolean,
  translator: Translator,
  relative: boolean = false,
): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];

  if (role.color) {
    description.push(`**${translate('info.role.color')}**: ${getRoleColorText(role.color)}`);
  } else {
    description.push(`**${translate('info.role.color')}**: ${translate('info.role.no_color')}`);
  }
  if (showCreated) {
    if (relative) {
      description.push(`**${translate('common.created')}**: <t:${Math.floor(role.createdAtUnix / 1000)}:R>`);
    } else {
      const timestamp = createTimestampMomentFromGuild(role.createdAtUnix, guildId);
      description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
  }
  description.push(`**${translate('info.role.hoisted')}**: ${(role.hoist) ? translate('common.yes') : translate('common.no')}`);
  description.push(`**${translate('common.id')}**: \`${role.id}\``);
  description.push(`**${translate('common.managed')}**: ${(role.managed) ? translate('common.yes') : translate('common.no')}`);
  description.push(`**${translate('info.role.mentionable')}**: ${(role.mentionable) ? translate('common.yes') : translate('common.no')}`);
  description.push(`**${translate('common.position')}**: ${role.position}`);

  if (role.tags) {
    if (role.isBoosterRole) {
      description.push(`**${translate('common.type')}**: ${translate('info.role.booster_role')}`);
    } else if (role.botId) {
      description.push(`**${translate('common.type')}**: ${translate('info.role.bot_role', {bot: `<@${role.botId}>`})}`);
    } else if (role.subscriptionListingId) {
      description.push(`**${translate('common.type')}**: ${translate('info.role.subscription_role', {id: role.subscriptionListingId})}`);
    } else if (role.tags.guildConnections) {
      description.push(`**${translate('common.type')}**: ${translate('info.role.linked_role')}`);
    } else if (role.integrationId) {
      description.push(`**${translate('common.type')}**: ${translate('info.role.integration_role', {id: String(role.integrationId)})}`);
    } else {
      description.push(`**${translate('common.type')}**: ${translate('common.unknown_value', {value: JSON.stringify(role.tags)})}`);
    }
  }
  return description;
}


export function getRoleHeaderLines(role: Structures.Role | null | undefined, roleId: string, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  return [
    `### ${(role) ? Markup.escape.all(role.name) : translate('logger.unknown_role')}`,
    `<@&${roleId}> ${Markup.spoiler(`(${roleId})`)}`,
  ];
}


export function getRoleThumbnailUrl(role: Structures.Role): string | null {
  if (role.icon) {
    return role.iconUrl;
  }
  if (role.color) {
    return createColorUrl(role.color);
  }
  return null;
}


export function formatGuildRoleCreate(
  event: GuildLoggingEventGuildRoleCreate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { role } = event.cached;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.role_created')} • ${timestamp}`);
  }

  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setDescription(`${role.mention} ${Markup.spoiler(`(${role.id})`)}`);

  embed.setAuthor(role.name);
  if (role.color) {
    const url = createColorUrl(role.color);
    embed.setAuthor(role.name, url);
  }

  const moderation = getRoleModerationLines(audits, translate('logger.created_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('common.information'), getRoleInformationLines(role, guildId, false, translator).join('\n'));
}


export function formatGuildRoleCreateComponents(
  event: GuildLoggingEventGuildRoleCreate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { role } = event.cached;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  // everything goes next to the role's icon/color thumbnail, the footer adds the divider so there's no body
  addContainerHeader(container, getRoleHeaderLines(role, role.id, translator), getRoleThumbnailUrl(role), false, [
    {title: translate('logger.moderation_action'), lines: getRoleModerationLines(audits, translate('logger.created_by'), translator)},
    {title: translate('common.information'), lines: getRoleInformationLines(role, guildId, false, translator, true)},
  ]);
  addContainerFooter(container, `${translate('logger.footer.role_created')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatGuildRoleDelete(
  event: GuildLoggingEventGuildRoleDelete,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { role, roleId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.role_deleted')} • ${timestamp}`);
  }

  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`<@&${roleId}> ${Markup.spoiler(`(${roleId})`)}`);

  const moderation = getRoleModerationLines(audits, translate('logger.deleted_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }

  if (role) {
    embed.setAuthor(role.name);
    if (role.color) {
      const url = createColorUrl(role.color);
      embed.setAuthor(role.name, url);
    }
    embed.addField(translate('common.information'), getRoleInformationLines(role, guildId, true, translator).join('\n'));
  }
}


export function formatGuildRoleDeleteComponents(
  event: GuildLoggingEventGuildRoleDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { role, roleId } = event.payload;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  // everything goes next to the role's icon/color thumbnail, the footer adds the divider so there's no body
  addContainerHeader(container, getRoleHeaderLines(role, roleId, translator), (role) ? getRoleThumbnailUrl(role) : null, false, [
    {title: translate('logger.moderation_action'), lines: getRoleModerationLines(audits, translate('logger.deleted_by'), translator)},
    {title: translate('common.information'), lines: (role) ? getRoleInformationLines(role, guildId, true, translator, true) : []},
  ]);
  addContainerFooter(container, `${translate('logger.footer.role_deleted')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getGuildRoleUpdateChanges(old: Structures.Role, role: Structures.Role, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];

  if (role.name !== old.name) {
    description.push(`- ${translate('common.name')}`);
    description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(old.name)}**`, new: `**${Markup.codestring(role.name)}**`})}`);
  }

  if (role.color !== old.color) {
    description.push(`- ${translate('info.role.color')}`);

    let addText = '';
    if (role.color) {
      const color = intToRGB(role.color);
      const hex = Markup.codestring(intToHex(role.color, true));
      const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
      addText = `**${hex}** **${rgb}**`;
    }
    let removeText = '';
    if (old.color) {
      const color = intToRGB(old.color);
      const hex = Markup.codestring(intToHex(old.color, true));
      const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
      removeText = `**${hex}** **${rgb}**`;
    }

    if (role.color) {
      // added or updated color

      if (old.color) {
        // updated color
        description.push(`-> ${translate('logger.change', {old: removeText, new: addText})}`);
      } else {
        description.push(`-> ${translate('logger.set_to', {value: `${addText}`})}`);
      }
    } else {
      // removed color
      description.push(`-> ${translate('logger.cleared', {value: `${removeText}`})}`);
    }
  }

  if (role.unicodeEmoji !== old.unicodeEmoji) {
    description.push(`- ${translate('logger.role.emoji')}`);

    let addText = '';
    if (role.unicodeEmoji) {
      addText = role.unicodeEmoji;
      if (15 < addText.length) {
        addText = addText.slice(0, 12) + '...';
      }
      addText = Markup.codestring(addText);
    }
    let removeText = '';
    if (old.unicodeEmoji) {
      removeText = old.unicodeEmoji;
      if (15 < removeText.length) {
        removeText = removeText.slice(0, 12) + '...';
      }
      removeText = Markup.codestring(removeText);
    }

    if (role.unicodeEmoji) {
      // added or updated emoji

      if (old.unicodeEmoji) {
        // updated emoji
        description.push(`-> ${translate('logger.change', {old: removeText, new: addText})}`);
      } else {
        description.push(`-> ${translate('logger.set_to', {value: `${addText}`})}`);
      }
    } else {
      // removed emoji
      description.push(`-> ${translate('logger.cleared', {value: `${removeText}`})}`);
    }
  }

  if (role.hoist !== old.hoist) {
    //description.push('- Hoist Change');
    if (role.hoist) {
      // added hoist
      description.push(`- ${translate('logger.role.hoisted')}`);
    } else {
      // removed hoist
      description.push(`- ${translate('logger.role.unhoisted')}`);
    }
  }

  if (role.icon !== old.icon) {
    description.push(`- ${translate('logger.role.icon')}`);
    if (role.icon && old.icon) {
      description.push(`-> ${translate('logger.role.icon_changed')}`);
    } else if (role.icon) {
      description.push(`-> ${translate('logger.role.icon_set')}`);
    } else {
      description.push(`-> ${translate('logger.role.icon_removed')}`);
    }
  }

  if (role.mentionable !== old.mentionable) {
    //description.push('- Mentionable Change');
    if (role.mentionable) {
      description.push(`- ${translate('logger.role.mentionable')}`);
    } else {
      description.push(`- ${translate('logger.role.unmentionable')}`);
    }
  }

  if (role.position !== old.position) {
    description.push(`- ${translate('common.position')}`);
    description.push(`-> ${translate('logger.change', {old: `#${old.position}`, new: `#${role.position}`})}`);
  }

  return description;
}


export function getGuildRolePermissionChanges(old: Structures.Role, role: Structures.Role, translator: Translator): {added: Array<string>, removed: Array<string>} {
  const added: Array<string> = [];
  const removed: Array<string> = [];
  if (role.permissions !== old.permissions) {
    const newPermissions = permissionsToObject(role.permissions);
    const oldPermissions = permissionsToObject(old.permissions);

    for (let key in newPermissions) {
      if (newPermissions[key] !== oldPermissions[key]) {
        if (newPermissions[key]) {
          added.push(`${translator.label('permissions', PermissionsText[key])}: ${StatusEmojis.YES}`);
        } else {
          removed.push(`${translator.label('permissions', PermissionsText[key])}: ${StatusEmojis.NO}`);
        }
      }
    }
  }
  return {added, removed};
}


export function formatGuildRoleUpdate(
  event: GuildLoggingEventGuildRoleUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { icons, old, role } = event.cached;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.role_updated')} • ${timestamp}`);
  }

  embed.setColor(EmbedColors.LOG_UPDATE);
  embed.setDescription(`${role.mention} ${Markup.spoiler(`(${role.id})`)}`);

  embed.setAuthor(role.name);
  if (role.icon) {
    embed.setAuthor(role.name, role.iconUrl!);
  } else if (role.color) {
    const url = createColorUrl(role.color);
    embed.setAuthor(role.name, url);
  }

  if (icons) {
    if (icons.current) {
      embed.setAuthor(role.name, `attachment://${icons.current.filename}`);
      files.push(icons.current);
    }
    if (icons.old) {
      embed.setThumbnail(`attachment://${icons.old.filename}`);
      files.push(icons.old);
    }
  }

  const moderation = getRoleModerationLines(audits, translate('logger.updated_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }

  const changes = getGuildRoleUpdateChanges(old, role, translator);
  if (changes.length) {
    embed.addField(translate('logger.changes'), changes.join('\n'));
  }

  const { added, removed } = getGuildRolePermissionChanges(old, role, translator);
  if (added.length) {
    embed.addField(translate('logger.role.enabled_permissions'), Markup.codeblock(added.join('\n')), true);
  }
  if (removed.length) {
    embed.addField(translate('logger.role.removed_permissions'), Markup.codeblock(removed.join('\n')), true);
  }
}


export function formatGuildRoleUpdateComponents(
  event: GuildLoggingEventGuildRoleUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { icons, old, role } = event.cached;

  const urls: {current?: string, old?: string} = {};
  if (icons) {
    if (icons.current) {
      urls.current = `attachment://${icons.current.filename}`;
      files.push(icons.current);
    }
    if (icons.old) {
      urls.old = `attachment://${icons.old.filename}`;
      files.push(icons.old);
    }
  }

  const { added, removed } = getGuildRolePermissionChanges(old, role, translator);

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  // the changes go next to the role's icon/color thumbnail, the permission codeblocks are too wide for that so they stay in the body
  const permissions: Array<ContainerSection> = [
    {title: translate('logger.role.enabled_permissions'), lines: (added.length) ? [Markup.codeblock(added.join('\n'))] : []},
    {title: translate('logger.role.removed_permissions'), lines: (removed.length) ? [Markup.codeblock(removed.join('\n'))] : []},
  ];
  addContainerHeader(container, getRoleHeaderLines(role, role.id, translator), urls.current || getRoleThumbnailUrl(role), hasContainerSections(permissions), [
    {title: translate('logger.moderation_action'), lines: getRoleModerationLines(audits, translate('logger.updated_by'), translator)},
    {title: translate('logger.changes'), lines: getGuildRoleUpdateChanges(old, role, translator)},
  ]);
  addContainerBody(container, permissions);

  if (urls.old) {
    const images = [{description: translate('logger.role.old_icon'), url: urls.old}];
    if (urls.current) {
      images.push({description: translate('logger.role.new_icon'), url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? translate('logger.role.icon_old_new') : translate('logger.role.old_icon'));
  }

  addContainerFooter(container, `${translate('logger.footer.role_updated')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}
