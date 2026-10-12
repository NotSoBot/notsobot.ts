import { Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { ChannelTypesText, DateMomentLogFormat, EmbedColors, PermissionsText } from '../../../constants';
import { createTimestampMomentFromGuild, createTimestampStringFromGuild, createUserString, permissionsToObject } from '../../../utils';

import type { Translator } from '../../i18n';
import { addContainerBody, addContainerFooter, addContainerHeader } from './tools';
import {
  GuildLoggingEventItemAudits,
  LogPayloadFiles,
  GuildLoggingEventChannelCreate,
  GuildLoggingEventChannelDelete,
  GuildLoggingEventChannelUpdate,
} from './types';


export function getChannelTypeText(type: ChannelTypes, translator: Translator): string {
  const { language, translate, translateMaybe } = translator;
  return translateMaybe(`channel.type.${type}`, (ChannelTypesText as Record<number, string>)[type] || translate('common.unknown_value', {value: type}));
}


export function getChannelModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];
  if (audits) {
    const [ audit ] = audits;
    description.push(`**${byText}**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
    if (audit.reason) {
      description.push(`**${translate('logger.reason')}**: ${Markup.codeblock(audit.reason)}`);
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


export function getChannelInformationLines(channel: Structures.Channel, guildId: string, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];
  description.push(`**${translate('common.type')}**: ${getChannelTypeText(channel.type, translator)}`);
  description.push(`**${translate('common.id')}**: ${Markup.codestring(channel.id)}`);
  if (channel.parentId) {
    description.push(`**${translate('logger.channel.category')}**: <#${channel.parentId}>`);
  }
  if (channel.position !== undefined) {
    description.push(`**${translate('common.position')}**: ${channel.position}`);
  }
  if (!channel.isGuildCategory) {
    description.push(`**${translate('info.channel.nsfw')}**: ${(channel.nsfw) ? translate('common.yes') : translate('common.no')}`);
  }
  if (channel.rateLimitPerUser) {
    description.push(`**${translate('logger.channel.slowmode')}**: ${translate('info.channel.ratelimit_seconds', {seconds: channel.rateLimitPerUser.toLocaleString(language)})}`);
  }
  if (channel.isVoice) {
    if (channel.bitrate) {
      description.push(`**${translate('info.channel.bitrate')}**: ${translate('info.channel.kbps', {value: (channel.bitrate / 1000).toLocaleString(language)})}`);
    }
    description.push(`**${translate('info.channel.user_limit')}**: ${(channel.userLimit) ? channel.userLimit.toLocaleString(language) : translate('common.unlimited')}`);
  }
  if (channel.permissionOverwrites.length) {
    description.push(`**${translate('logger.channel.permission_overwrites')}**: ${channel.permissionOverwrites.length.toLocaleString(language)}`);
  }
  {
    const timestamp = createTimestampMomentFromGuild(channel.createdAtUnix, guildId);
    description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
    description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
  }
  return description;
}


export function getChannelTopicLines(channel: Structures.Channel): Array<string> {
  return (channel.topic) ? [Markup.codeblock(channel.topic)] : [];
}


export function getChannelUpdateChanges(old: Structures.Channel, channel: Structures.Channel, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
  const description: Array<string> = [];

  if (channel.name !== old.name) {
    description.push(`- ${translate('common.name')}`);
    description.push(`-> ${translate('logger.change', {old: `**${Markup.codestring(old.name)}**`, new: `**${Markup.codestring(channel.name)}**`})}`);
  }

  if (channel.type !== old.type) {
    description.push(`- ${translate('common.type')}`);
    description.push(`-> ${translate('logger.change', {old: `**${getChannelTypeText(old.type, translator)}**`, new: `**${getChannelTypeText(channel.type, translator)}**`})}`);
  }

  if (channel.topic !== old.topic) {
    description.push(`- ${translate('logger.topic')}`);
    if (channel.topic && old.topic) {
      description.push(`-> ${translate('logger.from', {value: `${Markup.codeblock(old.topic)}`})}`);
      description.push(`-> ${translate('logger.to', {value: `${Markup.codeblock(channel.topic)}`})}`);
    } else if (channel.topic) {
      description.push(`-> ${translate('logger.set_to', {value: `${Markup.codeblock(channel.topic)}`})}`);
    } else {
      description.push(`-> ${translate('logger.cleared', {value: `${Markup.codeblock(old.topic || '')}`})}`);
    }
  }

  if (channel.nsfw !== old.nsfw) {
    description.push(`- ${translate((channel.nsfw) ? 'logger.channel.nsfw_marked' : 'logger.channel.nsfw_unmarked')}`);
  }

  if ((channel.rateLimitPerUser || 0) !== (old.rateLimitPerUser || 0)) {
    description.push(`- ${translate('logger.channel.slowmode')}`);
    if (channel.rateLimitPerUser) {
      description.push(`-> ${translate('logger.change', {old: (old.rateLimitPerUser || 0).toLocaleString(language), new: translate('info.channel.ratelimit_seconds', {seconds: channel.rateLimitPerUser.toLocaleString(language)})})}`);
    } else {
      description.push(`-> ${translate('common.disabled')}`);
    }
  }

  if ((channel.parentId || null) !== (old.parentId || null)) {
    description.push(`- ${translate('logger.channel.category')}`);
    if (channel.parentId && old.parentId) {
      description.push(`-> ${translate('logger.change', {old: `<#${old.parentId}>`, new: `<#${channel.parentId}>`})}`);
    } else if (channel.parentId) {
      description.push(`-> ${translate('logger.channel.moved_into', {channel: `<#${channel.parentId}>`})}`);
    } else {
      description.push(`-> ${translate('logger.channel.removed_from', {channel: `<#${old.parentId}>`})}`);
    }
  }

  if (channel.bitrate !== old.bitrate && channel.bitrate) {
    description.push(`- ${translate('info.channel.bitrate')}`);
    description.push(`-> ${translate('logger.change', {old: ((old.bitrate || 0) / 1000).toLocaleString(language), new: translate('info.channel.kbps', {value: (channel.bitrate / 1000).toLocaleString(language)})})}`);
  }

  if ((channel.userLimit || 0) !== (old.userLimit || 0)) {
    description.push(`- ${translate('info.channel.user_limit')}`);
    const oldText = (old.userLimit) ? old.userLimit.toLocaleString(language) : translate('common.unlimited');
    const newText = (channel.userLimit) ? channel.userLimit.toLocaleString(language) : translate('common.unlimited');
    description.push(`-> ${translate('logger.change', {old: oldText, new: newText})}`);
  }

  if ((channel.rtcRegion || null) !== (old.rtcRegion || null)) {
    description.push(`- ${translate('info.guild.region')}`);
    description.push(`-> ${translate('logger.change', {old: Markup.codestring(old.rtcRegion || translate('logger.channel.automatic')), new: Markup.codestring(channel.rtcRegion || translate('logger.channel.automatic'))})}`);
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


export function getChannelOverwriteChanges(guildId: string, old: Structures.Channel, channel: Structures.Channel, translator: Translator): Array<string> {
  const { language, translate, translateMaybe } = translator;
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
      description.push(`- ${translate('logger.channel.overwrite_added', {target})}`);
    } else if (!newOverwrite) {
      description.push(`- ${translate('logger.channel.overwrite_removed', {target})}`);
    } else {
      description.push(`- ${translate('logger.channel.overwrite_changed', {target})}`);
    }
    if (allowed.length) {
      description.push(`-> ${translate('logger.channel.allowed')}: ${allowed.join(', ')}`);
    }
    if (denied.length) {
      description.push(`-> ${translate('logger.channel.denied')}: ${denied.join(', ')}`);
    }
    if (reset.length && newOverwrite) {
      description.push(`-> ${translate('logger.channel.reset')}: ${reset.join(', ')}`);
    }
  }
  return description;
}


export function formatChannelCreate(
  event: GuildLoggingEventChannelCreate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setDescription(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`${translate('logger.footer.channel_created')} • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, translate('logger.created_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('logger.topic'), getChannelTopicLines(channel).join('\n'));
  embed.addField(translate('common.information'), getChannelInformationLines(channel, guildId, translator).join('\n'));
}


export function formatChannelCreateComponents(
  event: GuildLoggingEventChannelCreate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  addContainerHeader(container, getChannelHeaderLines(channel));
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: getChannelModerationLines(audits, translate('logger.created_by'), translator)},
    {title: translate('logger.topic'), lines: getChannelTopicLines(channel)},
    {title: translate('common.information'), lines: getChannelInformationLines(channel, guildId, translator)},
  ]);
  addContainerFooter(container, `${translate('logger.footer.channel_created')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatChannelDelete(
  event: GuildLoggingEventChannelDelete,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setDescription(`${Markup.codestring(channel.name)} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`${translate('logger.footer.channel_deleted')} • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, translate('logger.deleted_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('logger.topic'), getChannelTopicLines(channel).join('\n'));
  embed.addField(translate('common.information'), getChannelInformationLines(channel, guildId, translator).join('\n'));
}


export function formatChannelDeleteComponents(
  event: GuildLoggingEventChannelDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel } = event.cached;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, getChannelHeaderLines(channel, true));
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: getChannelModerationLines(audits, translate('logger.deleted_by'), translator)},
    {title: translate('logger.topic'), lines: getChannelTopicLines(channel)},
    {title: translate('common.information'), lines: getChannelInformationLines(channel, guildId, translator)},
  ]);
  addContainerFooter(container, `${translate('logger.footer.channel_deleted')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatChannelUpdate(
  event: GuildLoggingEventChannelUpdate,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel, old } = event.cached;

  embed.setAuthor(channel.name);
  embed.setColor(EmbedColors.LOG_UPDATE);
  embed.setDescription(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
  embed.setFooter(`${translate('logger.footer.channel_updated')} • ${createTimestampStringFromGuild(happened, guildId)}`);

  const moderation = getChannelModerationLines(audits, translate('logger.updated_by'), translator);
  if (moderation.length) {
    embed.addField(translate('logger.moderation_action'), moderation.join('\n'));
  }
  embed.addField(translate('logger.changes'), getChannelUpdateChanges(old, channel, translator).join('\n'));
  embed.addField(translate('logger.channel.permission_overwrites'), getChannelOverwriteChanges(guildId, old, channel, translator).join('\n'));
}


export function formatChannelUpdateComponents(
  event: GuildLoggingEventChannelUpdate,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { channel, old } = event.cached;

  container.setAccentColor(EmbedColors.LOG_UPDATE);
  addContainerHeader(container, getChannelHeaderLines(channel));
  addContainerBody(container, [
    {title: translate('logger.moderation_action'), lines: getChannelModerationLines(audits, translate('logger.updated_by'), translator)},
    {title: translate('logger.changes'), lines: getChannelUpdateChanges(old, channel, translator)},
    {title: translate('logger.channel.permission_overwrites'), lines: getChannelOverwriteChanges(guildId, old, channel, translator)},
  ]);
  addContainerFooter(container, `${translate('logger.footer.channel_updated')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}
