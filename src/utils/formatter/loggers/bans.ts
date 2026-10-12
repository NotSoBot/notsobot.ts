import { Structures } from 'detritus-client';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import { addContainerBody, addContainerFooter, addContainerHeader, createUserHeaderLines } from './tools';
import { GuildLoggingEventItemAudits, LogPayloadFiles, GuildLoggingEventGuildBanAdd, GuildLoggingEventGuildBanRemove } from './types';


export function getBanModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string): Array<string> {
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


export function formatGuildBanAdd(
  event: GuildLoggingEventGuildBanAdd,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  createUserEmbed(user, embed);
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(user.mention);

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`User Banned • ${timestamp}`);
  }

  const description = getBanModerationLines(audits, 'Banned By');
  if (description.length) {
    embed.addField('Moderation Action', description.join('\n'));
  }
}


export function formatGuildBanAddComponents(
  event: GuildLoggingEventGuildBanAdd,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  addContainerHeader(container, createUserHeaderLines(user.id, user), user.avatarUrlFormat(null, {size: 1024}));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getBanModerationLines(audits, 'Banned By')},
    {title: 'Information', lines: [`**Id**: ${Markup.codestring(user.id)}`]},
  ]);
  addContainerFooter(container, `User Banned • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatGuildBanRemove(
  event: GuildLoggingEventGuildBanRemove,
  embed: Embed,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  createUserEmbed(user, embed);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(user.mention);

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`User Unbanned • ${timestamp}`);
  }

  const description = getBanModerationLines(audits, 'Unbanned By');
  if (description.length) {
    embed.addField('Moderation Action', description.join('\n'));
  }
}


export function formatGuildBanRemoveComponents(
  event: GuildLoggingEventGuildBanRemove,
  container: ComponentContainer,
  files: LogPayloadFiles,
): void {
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  addContainerHeader(container, createUserHeaderLines(user.id, user), user.avatarUrlFormat(null, {size: 1024}));
  addContainerBody(container, [
    {title: 'Moderation Action', lines: getBanModerationLines(audits, 'Unbanned By')},
    {title: 'Information', lines: [`**Id**: ${Markup.codestring(user.id)}`]},
  ]);
  addContainerFooter(container, `User Unbanned • ${createTimestampStringFromGuild(happened, guildId)}`);
}
