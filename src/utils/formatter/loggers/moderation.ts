import { Structures } from 'detritus-client';
import { ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString, displayDetailsLine, displayTimestamp } from '../../../utils';

import type { Translator } from '../../i18n';
import { addContainerFooter, addContainerHeader, createContainerTitle, createFooterTimestamp, createUserHeaderLines } from './tools';
import {
  GuildLoggingEventGuildWarningAdd,
  GuildLoggingEventGuildWarningRemove,
  GuildLoggingEventGuildWarningsClear,
  LogPayloadFiles,
} from './types';


// who did it, the reason and the details on one small line, same in the embed field and next to the container's thumbnail
export function getWarningModerationLines(
  moderator: Structures.User,
  byText: string,
  reason: null | string,
  details: Array<0 | false | null | string | undefined>,
  translator: Translator,
): Array<string> {
  const { translate } = translator;
  const description: Array<string> = [`**${byText}**: ${createUserString(moderator.id, moderator)}`];
  if (reason) {
    description.push(`**${translate('logger.reason')}**: ${Markup.codeblock(reason)}`);
  }
  description.push(displayDetailsLine(details, true));
  return description;
}


// the warned user might not be cached when removing one of their warnings
function setUserEmbed(userId: string, user: Structures.User | null, embed: Embed, translator: Translator): void {
  if (user) {
    createUserEmbed(user, embed);
    embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
  } else {
    embed.setAuthor(translator.translate('logger.unknown_user'));
  }
  embed.setDescription(`<@${userId}>`);
}


function formatEmbed(
  embed: Embed,
  options: {color: number, footer: string, guildId: string, happened: number, moderation: Array<string>, translator: Translator},
): void {
  embed.setColor(options.color);
  embed.setFooter(`${options.footer} • ${createTimestampStringFromGuild(options.happened, options.guildId)}`);
  embed.addField(options.translator.translate('logger.moderation_action'), options.moderation.join('\n'));
}


function formatContainer(
  container: ComponentContainer,
  userId: string,
  user: Structures.User | null,
  options: {color: number, footer: string, happened: number, moderation: Array<string>, translator: Translator},
): void {
  const { translate } = options.translator;
  container.setAccentColor(options.color);
  // the moderation action goes right under the name, next to the avatar thumbnail, so there's no body
  addContainerHeader(container, [
    ...createUserHeaderLines(userId, user, options.translator),
    createContainerTitle(translate('logger.moderation_action')),
    ...options.moderation,
  ], (user) ? user.avatarUrlFormat(null, {size: 1024}) : null, false);
  addContainerFooter(container, `${options.footer} • ${createFooterTimestamp(options.happened)}`);
}


function getWarningAddLines(event: GuildLoggingEventGuildWarningAdd, translator: Translator): Array<string> {
  const { language, translate } = translator;
  const { counts, moderator, warning } = event.payload;
  return getWarningModerationLines(moderator, translate('logger.warned_by'), warning.reason, [
    Markup.codestring(warning.id),
    translate('moderation_warnings.active', {count: counts.active.toLocaleString(language)}),
    translate('moderation_warnings.total', {count: counts.total.toLocaleString(language)}),
  ], translator);
}


function getWarningRemoveLines(event: GuildLoggingEventGuildWarningRemove, translator: Translator): Array<string> {
  const { translate } = translator;
  const { moderator, warning } = event.payload;
  // the reason and moderator are the removed warning's own
  return getWarningModerationLines(moderator, translate('logger.removed_by'), warning.reason, [
    Markup.codestring(warning.id),
    translate('moderation_warnings.by', {user: `<@${warning.moderator_id}>`}),
    displayTimestamp(Date.parse(warning.created)),
  ], translator);
}


function getWarningsClearLines(event: GuildLoggingEventGuildWarningsClear, translator: Translator): Array<string> {
  const { language, translate } = translator;
  const { count, moderator } = event.payload;
  return getWarningModerationLines(moderator, translate('logger.cleared_by'), null, [
    translate('moderation_warnings_clear.removed', {count: count.toLocaleString(language)}),
  ], translator);
}


export function formatGuildWarningAdd(
  event: GuildLoggingEventGuildWarningAdd,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { guildId, happened } = event;
  const { user } = event.payload;
  setUserEmbed(user.id, user, embed, translator);
  formatEmbed(embed, {
    color: EmbedColors.LOG_UPDATE,
    footer: translator.translate('logger.footer.user_warned'),
    guildId,
    happened,
    moderation: getWarningAddLines(event, translator),
    translator,
  });
}


export function formatGuildWarningAddComponents(
  event: GuildLoggingEventGuildWarningAdd,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { happened } = event;
  const { user } = event.payload;
  formatContainer(container, user.id, user, {
    color: EmbedColors.LOG_UPDATE,
    footer: translator.translate('logger.footer.user_warned'),
    happened,
    moderation: getWarningAddLines(event, translator),
    translator,
  });
}


export function formatGuildWarningRemove(
  event: GuildLoggingEventGuildWarningRemove,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { guildId, happened } = event;
  const { user, warning } = event.payload;
  setUserEmbed(warning.user_id, user, embed, translator);
  formatEmbed(embed, {
    color: EmbedColors.LOG_CREATION,
    footer: translator.translate('logger.footer.warning_removed'),
    guildId,
    happened,
    moderation: getWarningRemoveLines(event, translator),
    translator,
  });
}


export function formatGuildWarningRemoveComponents(
  event: GuildLoggingEventGuildWarningRemove,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { happened } = event;
  const { user, warning } = event.payload;
  formatContainer(container, warning.user_id, user, {
    color: EmbedColors.LOG_CREATION,
    footer: translator.translate('logger.footer.warning_removed'),
    happened,
    moderation: getWarningRemoveLines(event, translator),
    translator,
  });
}


export function formatGuildWarningsClear(
  event: GuildLoggingEventGuildWarningsClear,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { guildId, happened } = event;
  const { user } = event.payload;
  setUserEmbed(user.id, user, embed, translator);
  formatEmbed(embed, {
    color: EmbedColors.LOG_CREATION,
    footer: translator.translate('logger.footer.warnings_cleared'),
    guildId,
    happened,
    moderation: getWarningsClearLines(event, translator),
    translator,
  });
}


export function formatGuildWarningsClearComponents(
  event: GuildLoggingEventGuildWarningsClear,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { happened } = event;
  const { user } = event.payload;
  formatContainer(container, user.id, user, {
    color: EmbedColors.LOG_CREATION,
    footer: translator.translate('logger.footer.warnings_cleared'),
    happened,
    moderation: getWarningsClearLines(event, translator),
    translator,
  });
}
