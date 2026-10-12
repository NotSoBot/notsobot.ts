import { Structures } from 'detritus-client';
import { ComponentContainer, Embed, Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors, PermissionsText, StatusEmojis } from '../../../constants';
import { createColorUrl, createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserString, permissionsToObject } from '../../../utils';

import { addContainerBody, addContainerFooter, addContainerGallery, addContainerHeader } from './tools';
import {
  GuildLoggingEventItemAudits,
  LogPayloadFiles,
  GuildLoggingEventGuildRoleCreate,
  GuildLoggingEventGuildRoleDelete,
  GuildLoggingEventGuildRoleUpdate,
} from './types';


export function getRoleModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string): Array<string> {
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


export function getRoleInformationLines(role: Structures.Role, guildId: string, showCreated: boolean): Array<string> {
  const description: Array<string> = [];

  if (role.color) {
    description.push(`**Color**: ${getRoleColorText(role.color)}`);
  } else {
    description.push(`**Color**: No Color`);
  }
  if (showCreated) {
    const timestamp = createTimestampMomentFromGuild(role.createdAtUnix, guildId);
    description.push(`**Created**: ${timestamp.fromNow()}`);
    description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
  }
  description.push(`**Hoisted**: ${(role.hoist) ? 'Yes' : 'No'}`);
  description.push(`**Id**: \`${role.id}\``);
  description.push(`**Managed**: ${(role.managed) ? 'Yes' : 'No'}`);
  description.push(`**Mentionable**: ${(role.mentionable) ? 'Yes' : 'No'}`);
  description.push(`**Position**: ${role.position}`);

  if (role.tags) {
    if (role.isBoosterRole) {
      description.push('**Type**: Booster Role');
    } else if (role.botId) {
      description.push(`**Type**: Bot Role (for <@${role.botId}>)`);
    } else if (role.integrationId) {
      description.push(`**Type**: Integration Role (${role.integrationId})`);
    } else {
      description.push(`**Type**: Unknown (${JSON.stringify(role.tags)})`);
    }
  }
  return description;
}


export function getRoleHeaderLines(role: Structures.Role | null | undefined, roleId: string): Array<string> {
  return [
    `### ${(role) ? Markup.escape.all(role.name) : 'Unknown Role'}`,
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
): void {
  const { audits, guildId, happened } = event;

  const { role } = event.cached;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Role Created • ${timestamp}`);
  }

  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setDescription(`${role.mention} ${Markup.spoiler(`(${role.id})`)}`);

  embed.setAuthor(role.name);
  if (role.color) {
    const url = createColorUrl(role.color);
    embed.setAuthor(role.name, url);
  }

  const moderation = getRoleModerationLines(audits, 'Created By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Information', getRoleInformationLines(role, guildId, false).join('\n'));
}


export function formatGuildRoleCreateComponents(
  event: GuildLoggingEventGuildRoleCreate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { role } = event.cached;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  addContainerHeader(container, getRoleHeaderLines(role, role.id), getRoleThumbnailUrl(role));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getRoleModerationLines(audits, 'Created By')},
    {title: 'Information', lines: getRoleInformationLines(role, guildId, false)},
  ]);
  addContainerFooter(container, `Role Created • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatGuildRoleDelete(
  event: GuildLoggingEventGuildRoleDelete,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { role, roleId } = event.payload;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Role Deleted • ${timestamp}`);
  }

  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`<@&${roleId}> ${Markup.spoiler(`(${roleId})`)}`);

  const moderation = getRoleModerationLines(audits, 'Deleted By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }

  if (role) {
    embed.setAuthor(role.name);
    if (role.color) {
      const url = createColorUrl(role.color);
      embed.setAuthor(role.name, url);
    }
    embed.addField('Information', getRoleInformationLines(role, guildId, true).join('\n'));
  }
}


export function formatGuildRoleDeleteComponents(
  event: GuildLoggingEventGuildRoleDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { role, roleId } = event.payload;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, getRoleHeaderLines(role, roleId), (role) ? getRoleThumbnailUrl(role) : null);
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getRoleModerationLines(audits, 'Deleted By')},
    {title: 'Information', lines: (role) ? getRoleInformationLines(role, guildId, true) : []},
  ]);
  addContainerFooter(container, `Role Deleted • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function getGuildRoleUpdateChanges(old: Structures.Role, role: Structures.Role): Array<string> {
  const description: Array<string> = [];

  if (role.color !== old.color) {
    description.push('- Color');

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
        description.push(`-> ${removeText} to ${addText}`);
      } else {
        description.push(`-> Set to ${addText}`);
      }
    } else {
      // removed color
      description.push(`-> Cleared ${removeText}`);
    }
  }

  if (role.unicodeEmoji !== old.unicodeEmoji) {
    description.push('- Emoji');

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
        description.push(`-> ${removeText} to ${addText}`);
      } else {
        description.push(`-> Set to ${addText}`);
      }
    } else {
      // removed emoji
      description.push(`-> Cleared ${removeText}`);
    }
  }

  if (role.hoist !== old.hoist) {
    //description.push('- Hoist Change');
    if (role.hoist) {
      // added hoist
      description.push('- Hoisted Role');
    } else {
      // removed hoist
      description.push('- Unhoisted Role');
    }
  }

  if (role.icon !== old.icon) {
    description.push('- Icon');
    if (role.icon && old.icon) {
      description.push('-> Changed Icons');
    } else if (role.icon) {
      description.push('-> Set Icon');
    } else {
      description.push('-> Removed Icon');
    }
  }

  if (role.mentionable !== old.mentionable) {
    //description.push('- Mentionable Change');
    if (role.mentionable) {
      description.push('- Made Mentionable');
    } else {
      description.push('- Made Unmentionable');
    }
  }

  if (role.position !== old.position) {
    description.push('- Position');
    description.push(`-> #${old.position} to #${role.position}`);
  }

  return description;
}


export function getGuildRolePermissionChanges(old: Structures.Role, role: Structures.Role): {added: Array<string>, removed: Array<string>} {
  const added: Array<string> = [];
  const removed: Array<string> = [];
  if (role.permissions !== old.permissions) {
    const newPermissions = permissionsToObject(role.permissions);
    const oldPermissions = permissionsToObject(old.permissions);

    for (let key in newPermissions) {
      if (newPermissions[key] !== oldPermissions[key]) {
        if (newPermissions[key]) {
          added.push(`${PermissionsText[key]}: ${StatusEmojis.YES}`);
        } else {
          removed.push(`${PermissionsText[key]}: ${StatusEmojis.NO}`);
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
): void {
  const { audits, guildId, happened } = event;

  const { icons, old, role } = event.cached;

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`Role Updated • ${timestamp}`);
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

  const moderation = getRoleModerationLines(audits, 'Updated By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }

  const changes = getGuildRoleUpdateChanges(old, role);
  if (changes.length) {
    embed.addField('Changes', changes.join('\n'));
  }

  const { added, removed } = getGuildRolePermissionChanges(old, role);
  if (added.length) {
    embed.addField('Enabled Permissions', Markup.codeblock(added.join('\n')), true);
  }
  if (removed.length) {
    embed.addField('Removed Permissions', Markup.codeblock(removed.join('\n')), true);
  }
}


export function formatGuildRoleUpdateComponents(
  event: GuildLoggingEventGuildRoleUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
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

  const { added, removed } = getGuildRolePermissionChanges(old, role);

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(container, getRoleHeaderLines(role, role.id), urls.current || getRoleThumbnailUrl(role));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getRoleModerationLines(audits, 'Updated By')},
    {title: 'Changes', lines: getGuildRoleUpdateChanges(old, role)},
    {title: 'Enabled Permissions', lines: (added.length) ? [Markup.codeblock(added.join('\n'))] : []},
    {title: 'Removed Permissions', lines: (removed.length) ? [Markup.codeblock(removed.join('\n'))] : []},
  ]);

  if (urls.old) {
    const images = [{description: 'Old Icon', url: urls.old}];
    if (urls.current) {
      images.push({description: 'New Icon', url: urls.current});
    }
    addContainerGallery(container, images, (urls.current) ? 'Icon (Old -> New)' : 'Old Icon');
  }

  addContainerFooter(container, `Role Updated • ${createTimestampStringFromGuild(happened, guildId)}`);
}
