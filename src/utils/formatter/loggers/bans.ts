import { Structures } from 'detritus-client';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString } from '../../../utils';

import type { Translator } from '../../i18n';
import { addContainerFooter, addContainerHeader, createContainerTitle, createUserHeaderLines } from './tools';
import { GuildLoggingEventItemAudits, LogPayloadFiles, GuildLoggingEventGuildBanAdd, GuildLoggingEventGuildBanRemove } from './types';


export function getBanModerationLines(audits: GuildLoggingEventItemAudits | undefined, byText: string, translator: Translator): Array<string> {
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


export function formatGuildBanAdd(
  event: GuildLoggingEventGuildBanAdd,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  createUserEmbed(user, embed);
  embed.setColor(EmbedColors.LOG_DELETION);
  embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(user.mention);

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.user_banned')} • ${timestamp}`);
  }

  const description = getBanModerationLines(audits, translate('logger.banned_by'), translator);
  if (description.length) {
    embed.addField(translate('logger.moderation_action'), description.join('\n'));
  }
}


export function formatGuildBanAddComponents(
  event: GuildLoggingEventGuildBanAdd,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  container.setAccentColor(EmbedColors.LOG_DELETION);
  // the moderation action goes right under the name, next to the avatar thumbnail, so there's no body
  const moderation = getBanModerationLines(audits, translate('logger.banned_by'), translator);
  addContainerHeader(container, [
    ...createUserHeaderLines(user.id, user, translator),
    ...((moderation.length) ? [createContainerTitle(translate('logger.moderation_action')), ...moderation] : []),
  ], user.avatarUrlFormat(null, {size: 1024}), false);
  addContainerFooter(container, `${translate('logger.footer.user_banned')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}


export function formatGuildBanRemove(
  event: GuildLoggingEventGuildBanRemove,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  createUserEmbed(user, embed);
  embed.setColor(EmbedColors.LOG_CREATION);
  embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  embed.setDescription(user.mention);

  {
    const timestamp = createTimestampStringFromGuild(happened, guildId);
    embed.setFooter(`${translate('logger.footer.user_unbanned')} • ${timestamp}`);
  }

  const description = getBanModerationLines(audits, translate('logger.unbanned_by'), translator);
  if (description.length) {
    embed.addField(translate('logger.moderation_action'), description.join('\n'));
  }
}


export function formatGuildBanRemoveComponents(
  event: GuildLoggingEventGuildBanRemove,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { language, translate, translateMaybe } = translator;
  const { audits, guildId, happened } = event;

  const { user } = event.payload;

  container.setAccentColor(EmbedColors.LOG_CREATION);
  // the moderation action goes right under the name, next to the avatar thumbnail, so there's no body
  const moderation = getBanModerationLines(audits, translate('logger.unbanned_by'), translator);
  addContainerHeader(container, [
    ...createUserHeaderLines(user.id, user, translator),
    ...((moderation.length) ? [createContainerTitle(translate('logger.moderation_action')), ...moderation] : []),
  ], user.avatarUrlFormat(null, {size: 1024}), false);
  addContainerFooter(container, `${translate('logger.footer.user_unbanned')} • ${createTimestampStringFromGuild(happened, guildId)}`);
}
