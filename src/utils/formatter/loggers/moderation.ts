import { Structures } from 'detritus-client';
import { MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContainer, Embed, Markup } from 'detritus-client/lib/utils';

import { DECOY_KEPT_REPEAT_TIME, EmbedColors, MessageComponentCustomIds } from '../../../constants';
import { createTimestampStringFromGuild, createUserEmbed, createUserString, displayDetailsLine, displayTimestamp, formatDuration } from '../../../utils';

import type { TranslationKey, Translator } from '../../i18n';
import { addContainerFooter, addContainerHeader, createContainerTitle, createFooterTimestamp, createUserHeaderLines } from './tools';
import {
  GuildLoggingDecoyReason,
  GuildLoggingEventDecoyCatch,
  GuildLoggingEventDecoyNoticeDelete,
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
    // on its own line so the container keeps it a codeblock (`collapseCodeblock` only shortens one after a label)
    description.push(`**${translate('logger.reason')}**:`, Markup.codeblock(reason));
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
  options: {
    color: number,
    footer: string,
    happened: number,
    moderation: Array<string>,
    translator: Translator,
    // a row of buttons above the footer
    buttons?: (row: ComponentActionRow) => void,
  },
): void {
  const { translate } = options.translator;
  container.setAccentColor(options.color);
  // the moderation action goes right under the name, next to the avatar thumbnail, so there's no body
  addContainerHeader(container, [
    ...createUserHeaderLines(userId, user, options.translator),
    createContainerTitle(translate('logger.moderation_action')),
    ...options.moderation,
  ], (user) ? user.avatarUrlFormat(null, {size: 1024}) : null, false);
  if (options.buttons) {
    options.buttons(container.createActionRow());
  }
  addContainerFooter(container, `${options.footer} • ${createFooterTimestamp(options.happened)}`);
}


// same labels and styles as the buttons under `warn`, the action (and the custom id format) is what
// `onGuildWarningLogComponent` takes
const WARNING_ADD_BUTTONS: Array<{action: string, labelKey: TranslationKey, style: MessageComponentButtonStyles}> = [
  {action: 'undo', labelKey: 'moderation_warn.undo', style: MessageComponentButtonStyles.SECONDARY},
  {action: 'mute', labelKey: 'moderation_warn.mute', style: MessageComponentButtonStyles.SECONDARY},
  {action: 'kick', labelKey: 'moderation_warn.kick', style: MessageComponentButtonStyles.SECONDARY},
  {action: 'ban', labelKey: 'moderation_warn.ban', style: MessageComponentButtonStyles.DANGER},
];

// static buttons, everything's in the custom id so they keep working after a restart. They're always shown, who can use
// them is checked on press (anyone with the action's permission, not only whoever warned them)
export function addGuildWarningAddButtons(event: GuildLoggingEventGuildWarningAdd, row: ComponentActionRow, translator: Translator): void {
  const { user, warning } = event.payload;
  for (let { action, labelKey, style } of WARNING_ADD_BUTTONS) {
    row.createButton({
      customId: `${MessageComponentCustomIds.GUILD_WARNING}.${action}.${user.id}.${warning.id}`,
      label: translator.translate(labelKey),
      style,
    });
  }
}


function getWarningAddLines(event: GuildLoggingEventGuildWarningAdd, translator: Translator): Array<string> {
  const { language, translate } = translator;
  const { counts, moderator, warning } = event.payload;
  return getWarningModerationLines(moderator, translate('logger.warned_by'), warning.reason, [
    Markup.codestring(warning.id),
    (1 < (warning.weight || 1)) && translate('moderation_autowarn.counts_as', {count: warning.weight.toLocaleString(language)}),
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
    buttons: (row) => addGuildWarningAddButtons(event, row, translator),
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


// why the decoy left them in the server (exempt, or it couldn't remove them), their message went either way
function getDecoyNotRemovedText(reason: GuildLoggingDecoyReason | null, translator: Translator): string {
  const { translate } = translator;
  switch (reason) {
    case 'owner': return translate('logger.decoy_exempt_owner');
    case 'administrator': return translate('logger.decoy_exempt_permission', {permission: translate('permissions.administrator')});
    case 'manage_messages': return translate('logger.decoy_exempt_permission', {permission: translate('permissions.manage_messages')});
    case 'autowarn_exempt': return translate('logger.decoy_exempt_autowarn');
    case 'missing_permission': return translate('logger.decoy_not_removed_permission', {permission: translate('permissions.ban_members')});
    case 'role_hierarchy': return translate('logger.decoy_not_removed_role');
  }
  return translate('logger.decoy_not_removed_failed');
}


// where, what they posted, and what happened to them
function getDecoyCatchLines(event: GuildLoggingEventDecoyCatch, translator: Translator): Array<string> {
  const { language, translate } = translator;
  const { action, attachments, channelId, clean, content, raid, reason, repeat, warned } = event.payload;
  const lines: Array<string> = [`**${translate('logger.decoy_caught_in')}**: <#${channelId}>`];
  if (content) {
    lines.push(`**${translate('logger.decoy_posted')}**:`, Markup.codeblock(content.slice(0, 900)));
  }
  let actionText: string;
  switch (action) {
    case 'ban': actionText = (reason === 'unban_failed') ? translate('logger.decoy_unban_failed') : translate('logger.decoy_banned'); break;
    case 'softban': actionText = (clean) ? translate('logger.decoy_softbanned', {
      duration: formatDuration(clean * 1000, language),
    }) : translate('logger.decoy_softbanned_no_clean'); break;
    case 'kept': actionText = translate('logger.decoy_kept', {button: translate('decoy.grace_button_keep')}); break;
    default: actionText = getDecoyNotRemovedText(reason, translator);
  }
  lines.push(displayDetailsLine([
    actionText,
    (warned) && translate('logger.decoy_warned'),
    (repeat) && translate('logger.decoy_repeat', {
      button: translate('decoy.grace_button_keep'),
      duration: formatDuration(DECOY_KEPT_REPEAT_TIME, language),
    }),
    (raid) && translate('logger.decoy_raid', {button: translate('decoy.grace_button_keep'), count: raid.toLocaleString(language)}),
    (attachments) && translate('logger.decoy_attachments', {count: attachments.toLocaleString(language)}),
  ], true));
  return lines;
}


export function formatDecoyCatch(
  event: GuildLoggingEventDecoyCatch,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { guildId, happened } = event;
  const { user } = event.payload;
  setUserEmbed(user.id, user, embed, translator);
  formatEmbed(embed, {
    color: (event.payload.action === 'none' || event.payload.action === 'exempt') ? EmbedColors.LOG_UPDATE : EmbedColors.LOG_DELETION,
    footer: translator.translate('logger.footer.decoy_catch'),
    guildId,
    happened,
    moderation: getDecoyCatchLines(event, translator),
    translator,
  });
}


export function formatDecoyCatchComponents(
  event: GuildLoggingEventDecoyCatch,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { happened } = event;
  const { user } = event.payload;
  formatContainer(container, user.id, user, {
    color: (event.payload.action === 'none' || event.payload.action === 'exempt') ? EmbedColors.LOG_UPDATE : EmbedColors.LOG_DELETION,
    footer: translator.translate('logger.footer.decoy_catch'),
    happened,
    moderation: getDecoyCatchLines(event, translator),
    translator,
  });
}


function getDecoyNoticeDeleteLines(event: GuildLoggingEventDecoyNoticeDelete, translator: Translator): Array<string> {
  const { channelId, userId } = event.payload;
  return [translator.translate('logger.decoy_notice_deleted', {channel: `<#${channelId}>`, user: `<@${userId}>`})];
}


export function formatDecoyNoticeDelete(
  event: GuildLoggingEventDecoyNoticeDelete,
  embed: Embed,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { guildId, happened } = event;
  const { user, userId } = event.payload;
  setUserEmbed(userId, user, embed, translator);
  formatEmbed(embed, {
    color: EmbedColors.LOG_UPDATE,
    footer: translator.translate('logger.footer.decoy_notice_deleted'),
    guildId,
    happened,
    moderation: getDecoyNoticeDeleteLines(event, translator),
    translator,
  });
}


export function formatDecoyNoticeDeleteComponents(
  event: GuildLoggingEventDecoyNoticeDelete,
  container: ComponentContainer,
  files: LogPayloadFiles,
  translator: Translator,
): void {
  const { happened } = event;
  const { user, userId } = event.payload;
  formatContainer(container, userId, user, {
    color: EmbedColors.LOG_UPDATE,
    footer: translator.translate('logger.footer.decoy_notice_deleted'),
    happened,
    moderation: getDecoyNoticeDeleteLines(event, translator),
    translator,
  });
}
