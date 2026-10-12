import { Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { ChannelTypesText, DateMomentLogFormat, EmbedColors, PermissionsText } from '../../../constants';
import { createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserString, permissionsToObject } from '../../../utils';

import { addContainerBody, addContainerFooter, addContainerHeader } from './tools';
import {
  GuildLoggingEventItemAudits,
  LogPayloadFiles,
  GuildLoggingEventChannelCreate,
  GuildLoggingEventChannelDelete,
  GuildLoggingEventChannelUpdate,
} from './types';


export function getChannelTypeText(type: ChannelTypes): string {
  return (ChannelTypesText as Record<number, string>)[type] || `Unknown (${type})`;
}


export function getChannelModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string): Array<string> {
  const description: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;
    description.push(`**${byText}**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
    if (audit.reason) {
      description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
    }
  }
  return description;
}


// deleted channels can't be mentioned anymore, so only show the name for those
export function getChannelHeaderLines(channel: Structures.Channel, deleted: boolean = false): Array<string> {
  const name = Markup.escape.all(channel.name);
  return [
    `### ${(channel.isGuildCategory || channel.isVoice) ? name : `#${name}`}`,
    `${(deleted) ? Markup.codestring(channel.name) : channel.mention} ${Markup.spoiler(`(${channel.id})`)}`,
  ];
}


export function getChannelOverwriteTargetText(guildId: string, overwrite: Structures.Overwrite): string {
  if (overwrite.isRole) {
    return (overwrite.id === guildId) ? '@everyone' : `<@&${overwrite.id}>`;
  }
  return `<@${overwrite.id}>`;
}


export function getChannelInformationLines(channel: Structures.Channel, guildId: string): Array<string> {
  const description: Array<string> = [];
  description.push(`**Type**: ${getChannelTypeText(channel.type)}`);
  description.push(`**Id**: ${Markup.codestring(channel.id)}`);
  if (channel.parentId) {
    description.push(`**Category**: <#${channel.parentId}>`);
  }
  if (channel.position !== undefined) {
    description.push(`**Position**: ${channel.position}`);
  }
  if (!channel.isGuildCategory) {
    description.push(`**NSFW**: ${(channel.nsfw) ? 'Yes' : 'No'}`);
  }
  if (channel.rateLimitPerUser) {
    description.push(`**Slowmode**: ${channel.rateLimitPerUser.toLocaleString()} seconds`);
  }
  if (channel.isVoice) {
    if (channel.bitrate) {
      description.push(`**Bitrate**: ${(channel.bitrate / 1000).toLocaleString()} kbps`);
    }
    description.push(`**User Limit**: ${(channel.userLimit) ? channel.userLimit.toLocaleString() : 'Unlimited'}`);
  }
  if (channel.permissionOverwrites.length) {
    description.push(`**Permission Overwrites**: ${channel.permissionOverwrites.length.toLocaleString()}`);
  }
  {
    const timestamp = createTimestampMomentFromGuild(channel.createdAtUnix, guildId);
    description.push(`**Created**: ${timestamp.fromNow()}`);
    description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
  }
  return description;
}


export function getChannelTopicLines(channel: Structures.Channel): Array<string> {
  return (channel.topic) ? [Markup.codeblock(channel.topic)] : [];
}


export function getChannelUpdateChanges(old: Structures.Channel, channel: Structures.Channel): Array<string> {
  const description: Array<string> = [];

  if (channel.name !== old.name) {
    description.push('- Name');
    description.push(`-> **${Markup.codestring(old.name)}** to **${Markup.codestring(channel.name)}**`);
  }

  if (channel.type !== old.type) {
    description.push('- Type');
    description.push(`-> **${getChannelTypeText(old.type)}** to **${getChannelTypeText(channel.type)}**`);
  }

  if (channel.topic !== old.topic) {
    description.push('- Topic');
    if (channel.topic && old.topic) {
      description.push(`-> From ${Markup.codeblock(old.topic)}`);
      description.push(`-> To ${Markup.codeblock(channel.topic)}`);
    } else if (channel.topic) {
      description.push(`-> Set to ${Markup.codeblock(channel.topic)}`);
    } else {
      description.push(`-> Cleared ${Markup.codeblock(old.topic || '')}`);
    }
  }

  if (channel.nsfw !== old.nsfw) {
    description.push((channel.nsfw) ? '- Marked as NSFW' : '- Unmarked as NSFW');
  }

  if ((channel.rateLimitPerUser || 0) !== (old.rateLimitPerUser || 0)) {
    description.push('- Slowmode');
    if (channel.rateLimitPerUser) {
      description.push(`-> ${(old.rateLimitPerUser || 0).toLocaleString()} to ${channel.rateLimitPerUser.toLocaleString()} seconds`);
    } else {
      description.push('-> Disabled');
    }
  }

  if ((channel.parentId || null) !== (old.parentId || null)) {
    description.push('- Category');
    if (channel.parentId && old.parentId) {
      description.push(`-> <#${old.parentId}> to <#${channel.parentId}>`);
    } else if (channel.parentId) {
      description.push(`-> Moved into <#${channel.parentId}>`);
    } else {
      description.push(`-> Removed from <#${old.parentId}>`);
    }
  }

  if (channel.bitrate !== old.bitrate && channel.bitrate) {
    description.push('- Bitrate');
    description.push(`-> ${((old.bitrate || 0) / 1000).toLocaleString()} to ${(channel.bitrate / 1000).toLocaleString()} kbps`);
  }

  if ((channel.userLimit || 0) !== (old.userLimit || 0)) {
    description.push('- User Limit');
    const oldText = (old.userLimit) ? old.userLimit.toLocaleString() : 'Unlimited';
    const newText = (channel.userLimit) ? channel.userLimit.toLocaleString() : 'Unlimited';
    description.push(`-> ${oldText} to ${newText}`);
  }

  if ((channel.rtcRegion || null) !== (old.rtcRegion || null)) {
    description.push('- Region');
    description.push(`-> ${Markup.codestring(old.rtcRegion || 'Automatic')} to ${Markup.codestring(channel.rtcRegion || 'Automatic')}`);
  }

  return description;
}


// allow/deny/neutral for every permission, so changed overwrites can show exactly what flipped
export function getOverwritePermissionStates(overwrite?: Structures.Overwrite): Record<string, 'allow' | 'deny' | 'neutral'> {
  const states: Record<string, 'allow' | 'deny' | 'neutral'> = {};
  const allow = permissionsToObject((overwrite) ? overwrite.allow : 0);
  const deny = permissionsToObject((overwrite) ? overwrite.deny : 0);
  for (let key in allow) {
    states[key] = (allow[key]) ? 'allow' : (deny[key]) ? 'deny' : 'neutral';
  }
  return states;
}


export function getChannelOverwriteChanges(guildId: string, old: Structures.Channel, channel: Structures.Channel): Array<string> {
  const description: Array<string> = [];

  const ids = new Set<string>([...old.permissionOverwrites.keys(), ...channel.permissionOverwrites.keys()]);
  for (let id of ids) {
    const oldOverwrite = old.permissionOverwrites.get(id);
    const newOverwrite = channel.permissionOverwrites.get(id);
    if (oldOverwrite && newOverwrite && oldOverwrite.allow === newOverwrite.allow && oldOverwrite.deny === newOverwrite.deny) {
      continue;
    }
    const target = getChannelOverwriteTargetText(guildId, (newOverwrite || oldOverwrite)!);

    const oldStates = getOverwritePermissionStates(oldOverwrite);
    const newStates = getOverwritePermissionStates(newOverwrite);
    const allowed: Array<string> = [];
    const denied: Array<string> = [];
    const reset: Array<string> = [];
    for (let key in newStates) {
      if (newStates[key] === oldStates[key]) {
        continue;
      }
      const text = (PermissionsText as Record<string, string>)[key] || key;
      switch (newStates[key]) {
        case 'allow': allowed.push(text); break;
        case 'deny': denied.push(text); break;
        case 'neutral': reset.push(text); break;
      }
    }

    if (!oldOverwrite) {
      description.push(`- Added Overwrite for ${target}`);
    } else if (!newOverwrite) {
      description.push(`- Removed Overwrite for ${target}`);
    } else {
      description.push(`- Changed Overwrite for ${target}`);
    }
    if (allowed.length) {
      description.push(`-> Allowed: ${allowed.join(', ')}`);
    }
    if (denied.length) {
      description.push(`-> Denied: ${denied.join(', ')}`);
    }
    if (reset.length && newOverwrite) {
      description.push(`-> Reset: ${reset.join(', ')}`);
    }
  }
  return description;
}


export function formatChannelCreate(
  event: GuildLoggingEventChannelCreate,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setDescription(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`Channel Created • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, 'Created By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Topic', getChannelTopicLines(channel).join('\n'));
  embed.addField('Information', getChannelInformationLines(channel, guildId).join('\n'));
}


export function formatChannelCreateComponents(
  event: GuildLoggingEventChannelCreate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  addContainerHeader(container, getChannelHeaderLines(channel));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getChannelModerationLines(audits, 'Created By')},
    {title: 'Topic', lines: getChannelTopicLines(channel)},
    {title: 'Information', lines: getChannelInformationLines(channel, guildId)},
  ]);
  addContainerFooter(container, `Channel Created • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatChannelDelete(
  event: GuildLoggingEventChannelDelete,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`${Markup.codestring(channel.name)} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`Channel Deleted • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, 'Deleted By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Topic', getChannelTopicLines(channel).join('\n'));
  embed.addField('Information', getChannelInformationLines(channel, guildId).join('\n'));
}


export function formatChannelDeleteComponents(
  event: GuildLoggingEventChannelDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, getChannelHeaderLines(channel, true));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getChannelModerationLines(audits, 'Deleted By')},
    {title: 'Topic', lines: getChannelTopicLines(channel)},
    {title: 'Information', lines: getChannelInformationLines(channel, guildId)},
  ]);
  addContainerFooter(container, `Channel Deleted • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatChannelUpdate(
  event: GuildLoggingEventChannelUpdate,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel, old } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_UPDATE);
  embed.setDescription(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`Channel Updated • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, 'Updated By');
  if (moderation.length) {
    embed.addField('Moderation Action', moderation.join('\n'));
  }
  embed.addField('Changes', getChannelUpdateChanges(old, channel).join('\n'));
  embed.addField('Permission Overwrites', getChannelOverwriteChanges(guildId, old, channel).join('\n'));
}


export function formatChannelUpdateComponents(
  event: GuildLoggingEventChannelUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { channel, old } = event.cached;

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(container, getChannelHeaderLines(channel));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getChannelModerationLines(audits, 'Updated By')},
    {title: 'Changes', lines: getChannelUpdateChanges(old, channel)},
    {title: 'Permission Overwrites', lines: getChannelOverwriteChanges(guildId, old, channel)},
  ]);
  addContainerFooter(container, `Channel Updated • ${createTimestampStringFromGuild(happened, guildId)}`);
}
