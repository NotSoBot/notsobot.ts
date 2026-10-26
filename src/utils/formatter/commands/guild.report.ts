import { ClusterClient, Command, Interaction, ShardClient, Structures } from 'detritus-client';
import {
  DiscordAbortCodes,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';
import { ComponentContext, Components, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { createGuildReport, editGuildReport, editGuildReportLogMessages } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import GuildSettingsStore from '../../../stores/guildsettings';
import {
  EmbedColors,
  GuildLoggerTypes,
  GuildReportTypes,
  GuildSettingsResponseDisplayTypes,
  MAX_GUILD_REPORT_MESSAGE_CONTENT_LENGTH,
  MessageComponentCustomIds,
  ReportStatuses,
  StatusEmojis,
} from '../../../constants';
import { RedisPayloads } from '../../../types';
import { Languages, Translator, getCachedTranslator, getTranslator, getTranslatorForLanguage, languageFromLocale } from '../../i18n';
import {
  DisplayPayload,
  createTimestampStringFromGuild,
  createUserEmbed,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
} from '../../../utils';

import {
  addContainerBody,
  addContainerFooter,
  addContainerHeader,
  createContainerTitle,
  createFooterTimestamp,
  createUserHeaderLines,
  sanitizeEmbed,
} from '../loggers';


export const COMMAND_ID = 'guild.report';
export const COMMAND_ID_MESSAGE = 'guild.report.message';
export const COMMAND_ID_USER = 'guild.report.user';

export interface CommandArgs {
  reason: string,
  // the reported message, for message reports
  message?: Structures.Message,
  // undefined when no user was given, null when the given user couldn't be found
  user?: Structures.Member | Structures.User | null,
}

// the button's `guild-report.{action}.{reportId}` and the status it sets
export const ReportActionStatuses: Record<string, ReportStatuses> = {
  dismiss: ReportStatuses.DISMISSED,
  reopen: ReportStatuses.OPEN,
  resolve: ReportStatuses.RESOLVED,
};

// the side color is the report's status, same as the dms about reports to the developers
const ReportStatusColors: Record<ReportStatuses, number> = {
  [ReportStatuses.OPEN]: EmbedColors.LOG_UPDATE,
  [ReportStatuses.RESOLVED]: EmbedColors.LOG_CREATION,
  [ReportStatuses.DISMISSED]: EmbedColors.DEFAULT,
};

// dashboard changes wait this long before the bot edits anything, so a burst of them (a report flipped back and forth,
// several moderators at once) becomes one edit per report with its latest state
const REPORT_UPDATE_DELAY = 5000;

// the dashboard changes waiting to be drawn, by server then report (only the latest per report), and the servers whose
// queue is being worked through. one report's messages are edited at a time per server, so however many changes come in
// it never sends more than one edit at once per server (and detritus waits out any 429 on its own)
const reportUpdates = new Map<string, Map<string, RedisPayloads.GuildReportUpdate>>();
const reportUpdateWorkers = new Set<string>();


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return displayReply(context, await createPayload(context, args));
}


// what to show instead of the report when the server has nowhere to send it (no reports logger), null when it does
// whoever can add one is told how, everyone gets pointed at the developers' `bot report`
export async function getDisabledPayload(
  context: Command.Context | Interaction.InteractionContext,
): Promise<DisplayPayload | null> {
  const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (settings && settings.loggers.some((logger) => logger.type === GuildLoggerTypes.REPORTS)) {
    return null;
  }
  const { translate } = await getTranslator(context);
  const prefix = (context instanceof Command.Context) ? (context.prefix || '') : '/';
  const setup = (context instanceof Command.Context) ? `${prefix}loggers add reports` : '/server loggers add reports';
  const lines = [
    `${StatusEmojis.WARNING} ${translate('guild_report.disabled', {command: Markup.codestring(`${prefix}bot report`)})}`,
  ];
  if (context.member && context.member.can(Permissions.MANAGE_GUILD)) {
    lines.push(translate('guild_report.disabled_setup', {command: Markup.codestring(setup)}));
  }
  return {description: lines.join('\n'), ephemeral: true};
}


// the slash command and context menus respond through their modal's context, so this only creates the report and
// returns what to show
export async function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<DisplayPayload> {
  const { payload } = await createReport(context, args);
  return payload;
}


// the report is null when it wasn't sent (the payload says why)
export async function createReport(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<{payload: DisplayPayload, report: RestResponsesRaw.GuildReport | null}> {
  const { translate } = await getTranslator(context);
  const refuse = (description: string) => ({payload: {description: `${StatusEmojis.WARNING} ${description}`, ephemeral: true}, report: null});

  const reason = (args.reason || '').trim();
  if (!reason) {
    return refuse(translate('report.needs_content'));
  }

  const disabled = await getDisabledPayload(context);
  if (disabled) {
    return {payload: disabled, report: null};
  }

  let target: Structures.User;
  let message: Structures.Message | null = null;
  if (args.message) {
    message = args.message;
    target = message.author;
  } else if (args.user === undefined) {
    return refuse(translate('report.needs_user'));
  } else if (!args.user) {
    return refuse(translate('report.unknown_user'));
  } else {
    target = (args.user instanceof Structures.Member) ? args.user.user : args.user;
  }
  if (target.id === context.userId) {
    return refuse(translate('report.cannot_report_yourself'));
  }

  const report = await createGuildReport(context, context.guildId!, {
    channelId: (message) ? message.channelId : undefined,
    messageContent: (message && message.content) ? message.content.slice(0, MAX_GUILD_REPORT_MESSAGE_CONTENT_LENGTH) : null,
    messageId: (message) ? message.id : undefined,
    reason,
    targetId: target.id,
    type: (message) ? GuildReportTypes.MESSAGE : GuildReportTypes.USER,
    userId: context.userId,
  });
  await postReportLog(context.client, report, target);

  return {payload: {description: `${StatusEmojis.YES} ${translate('guild_report.sent')}`, ephemeral: true}, report};
}


// like the loggers, nobody's invoking a command when it's shown so it's in the server's preferred locale
export function getReportLogTranslator(shard: ShardClient, guildId: string): Translator {
  const guild = shard.guilds.get(guildId);
  return getTranslatorForLanguage(languageFromLocale((guild) ? guild.preferredLocale : null) || Languages.ENGLISH);
}

async function fetchUser(shard: ShardClient, userId: string): Promise<Structures.User | null> {
  const user = shard.users.get(userId);
  if (user) {
    return user;
  }
  try {
    return await shard.rest.fetchUser(userId);
  } catch(error) {
    return null;
  }
}

// one message per report in each of the server's reports loggers, they aren't batched like the other logs so each
// message keeps its own buttons. a logger failing doesn't fail the report, `moderation reports` still lists it.
// the messages are saved on the report so the dashboard's changes can redraw them (`onGuildReportUpdate`)
export async function postReportLog(
  shard: ShardClient,
  report: RestResponsesRaw.GuildReport,
  target: Structures.User | null,
): Promise<void> {
  const settings = await GuildSettingsStore.getOrFetch({client: shard}, report.guild_id);
  if (!settings) {
    return;
  }
  const loggers = settings.loggers.filter((logger) => logger.type === GuildLoggerTypes.REPORTS);
  if (!loggers.length) {
    return;
  }
  // legacy and no embed both stay as embeds, same as the other loggers
  const componentsV2 = !!settings.settings && (settings.settings.responseDisplay ?? GuildSettingsResponseDisplayTypes.DEFAULT) === GuildSettingsResponseDisplayTypes.DEFAULT;
  const payload = createReportLogMessage(getReportLogTranslator(shard, report.guild_id), report, target, componentsV2);
  const results = await Promise.allSettled(loggers.map((logger) => logger.execute(shard, {...payload, wait: true})));
  const messages: Array<RestResponsesRaw.GuildReportLogMessage> = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Guild Report ${report.id} failed to log for ${report.guild_id}`, result.reason);
    } else if (result.value instanceof Structures.Message) {
      messages.push({channel_id: result.value.channelId, message_id: result.value.id, webhook_id: loggers[i].webhookId!});
    }
  });
  if (messages.length) {
    try {
      await editGuildReportLogMessages({client: shard}, report.guild_id, report.id, {messages});
    } catch(error) {
      console.error(`Guild Report ${report.id} failed to save its log messages for ${report.guild_id}`, error);
    }
  }
}


function shardForGuild(cluster: ClusterClient, guildId: string): ShardClient | undefined {
  return cluster.shards.get(Number((BigInt(guildId) >> 22n) % BigInt(cluster.shardCount)));
}

// a report resolved, dismissed or reopened from the dashboard, queued for `REPORT_UPDATE_DELAY`. only the cluster with
// the server's shard keeps it
export function queueGuildReportUpdate(cluster: ClusterClient, payload: RedisPayloads.GuildReportUpdate): void {
  const { report } = payload;
  if (!payload.log_messages.length || !shardForGuild(cluster, report.guild_id)) {
    return;
  }
  let updates = reportUpdates.get(report.guild_id);
  if (!updates) {
    updates = new Map();
    reportUpdates.set(report.guild_id, updates);
  }
  const queued = updates.get(report.id);
  if (!queued || queued.created <= payload.created) {
    updates.set(report.id, payload);
  }
  if (!reportUpdateWorkers.has(report.guild_id)) {
    reportUpdateWorkers.add(report.guild_id);
    runGuildReportUpdates(cluster, report.guild_id);
  }
}

// a button on one of its messages was used after the dashboard change, so that change is already out of date
function dropQueuedGuildReportUpdate(guildId: string, reportId: string): void {
  const updates = reportUpdates.get(guildId);
  if (updates) {
    updates.delete(reportId);
  }
}

// waits, then edits whatever's queued one report at a time. changes that come in meanwhile wait for the next round (or
// are picked up by this one if it hasn't reached them yet). a failed edit is never retried, the next change redraws it
async function runGuildReportUpdates(cluster: ClusterClient, guildId: string): Promise<void> {
  try {
    while (true) {
      await Timers.sleep(REPORT_UPDATE_DELAY);
      const updates = reportUpdates.get(guildId);
      if (!updates || !updates.size) {
        reportUpdates.delete(guildId);
        break;
      }
      for (let [reportId, payload] of updates) {
        updates.delete(reportId);
        try {
          await updateReportLogMessages(cluster, payload);
        } catch(error) {
          console.error(`Guild Report ${reportId} failed to update for ${guildId}`, error);
        }
      }
    }
  } finally {
    reportUpdateWorkers.delete(guildId);
  }
}

// redrawn the same way the buttons do (in the format each was sent in), deleted messages and removed loggers are skipped
async function updateReportLogMessages(cluster: ClusterClient, payload: RedisPayloads.GuildReportUpdate): Promise<void> {
  const { report } = payload;
  const shard = shardForGuild(cluster, report.guild_id);
  if (!shard) {
    return;
  }
  const settings = await GuildSettingsStore.getOrFetch({client: shard}, report.guild_id);
  if (!settings) {
    return;
  }
  const translator = getReportLogTranslator(shard, report.guild_id);
  const target = await fetchUser(shard, report.target_id);
  for (let logMessage of payload.log_messages) {
    const logger = settings.loggers.find((logger) => {
      return logger.type === GuildLoggerTypes.REPORTS && logger.webhookId === logMessage.webhook_id;
    });
    if (!logger || !logger.webhookId || !logger.webhookToken) {
      continue;
    }
    try {
      const message = await shard.rest.fetchWebhookTokenMessage(logger.webhookId, logger.webhookToken, logMessage.message_id);
      const componentsV2 = (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2;
      const { flags, ...options } = createReportLogMessage(translator, report, target, componentsV2);
      await shard.rest.editWebhookTokenMessage(logger.webhookId, logger.webhookToken, logMessage.message_id, {...options, withComponents: true});
    } catch(error) {
      if (error.code !== DiscordAbortCodes.UNKNOWN_MESSAGE && error.code !== DiscordAbortCodes.UNKNOWN_WEBHOOK) {
        console.error(`Guild Report ${report.id} failed to update its log message ${logMessage.message_id} for ${report.guild_id}`, error);
      }
    }
  }
}


function getStatusText(translate: Translator['translate'], status: ReportStatuses): string {
  switch (status) {
    case ReportStatuses.OPEN: return translate('report_list.status_open');
    case ReportStatuses.RESOLVED: return translate('report_list.status_resolved');
    case ReportStatuses.DISMISSED: return translate('report_list.status_dismissed');
  }
  return String(status);
}

export function getReportMessageUrl(report: RestResponsesRaw.GuildReport): null | string {
  if (report.type !== GuildReportTypes.MESSAGE || !report.channel_id || !report.message_id) {
    return null;
  }
  return DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(report.guild_id, report.channel_id, report.message_id);
}

// who reported it and why, then "`id` • Resolved by @moderator • 5 minutes ago" (or just "Open")
function getReportLines(translator: Translator, report: RestResponsesRaw.GuildReport): Array<string> {
  const { translate } = translator;
  const status = getStatusText(translate, report.status);
  return [
    `**${translate('guild_report_log.reported_by')}**: <@${report.user_id}>`,
    `**${translate('logger.reason')}**: ${Markup.codeblock(report.reason)}`,
    displayDetailsLine([
      Markup.codestring(report.id),
      (report.handled_by) ? translate('guild_report_log.handled', {status, user: `<@${report.handled_by}>`}) : status,
      (report.handled_at) && displayTimestamp(Date.parse(report.handled_at)),
    ], true),
  ];
}

function getMessageLines(translator: Translator, report: RestResponsesRaw.GuildReport): Array<string> {
  if (report.type !== GuildReportTypes.MESSAGE) {
    return [];
  }
  // the api clears the text 30 days after the report, so moderators are told when and can save it before then
  if (report.message_content) {
    const lines = [Markup.codeblock(report.message_content)];
    if (report.message_content_expires_at) {
      lines.push(`-# ${translator.translate('guild_report_log.text_expires', {when: displayTimestamp(report.message_content_expires_at)})}`);
    }
    return lines;
  }
  if (report.message_content_deleted) {
    return [`*${translator.translate('guild_report_log.text_deleted')}*`];
  }
  return [`*${translator.translate('guild_report_log.no_text')}*`];
}

// open: resolve and dismiss, handled: reopen, plus the reported message for message reports
function createReportButtons(translator: Translator, report: RestResponsesRaw.GuildReport, components: Components): void {
  const { translate } = translator;
  const row = components.createActionRow();
  const customId = (action: string) => `${MessageComponentCustomIds.GUILD_REPORT}.${action}.${report.id}`;
  if (report.status === ReportStatuses.OPEN) {
    row.createButton({customId: customId('resolve'), label: translate('guild_report_log.resolve'), style: MessageComponentButtonStyles.SUCCESS});
    row.createButton({customId: customId('dismiss'), label: translate('guild_report_log.dismiss'), style: MessageComponentButtonStyles.SECONDARY});
  } else {
    row.createButton({customId: customId('reopen'), label: translate('guild_report_log.reopen'), style: MessageComponentButtonStyles.SECONDARY});
  }
  const url = getReportMessageUrl(report);
  if (url) {
    row.createButton({label: translate('guild_report_log.jump'), url});
  }
}

// laid out like the moderation logger: the reported member's header with the report next to their avatar, the reported
// message under it, what kind of report it is in the footer and the status as the side color
export function createReportLogMessage(
  translator: Translator,
  report: RestResponsesRaw.GuildReport,
  target: Structures.User | null,
  componentsV2: boolean,
): {allowedMentions: {parse: []}, components: Components, embeds?: Array<Embed>, flags?: number} {
  const { translate } = translator;
  const color = ReportStatusColors[report.status] ?? EmbedColors.DEFAULT;
  const footer = (report.type === GuildReportTypes.MESSAGE)
    ? translate('guild_report_log.footer_message')
    : translate('guild_report_log.footer_user');
  const created = Date.parse(report.created);
  const lines = getReportLines(translator, report);
  const messageLines = getMessageLines(translator, report);

  const components = new Components();
  if (componentsV2) {
    const container = components.createContainer();
    container.setAccentColor(color);
    addContainerHeader(container, [
      ...createUserHeaderLines(report.target_id, target, translator),
      createContainerTitle(translate('guild_report_log.title')),
      ...lines,
    ], (target) ? target.avatarUrlFormat(null, {size: 1024}) : null, !!messageLines.length);
    addContainerBody(container, [{title: translate('guild_report_log.message'), lines: messageLines}]);
    addContainerFooter(container, `${footer} • ${createFooterTimestamp(created)}`);
    createReportButtons(translator, report, components);
    // text displays actually ping, unlike embeds
    return {allowedMentions: {parse: []}, components, flags: MessageFlags.IS_COMPONENTS_V2};
  }

  const embed = new Embed();
  if (target) {
    createUserEmbed(target, embed);
    embed.setThumbnail(target.avatarUrlFormat(null, {size: 1024}));
  } else {
    embed.setAuthor(translate('logger.unknown_user'));
  }
  embed.setColor(color);
  embed.setDescription(`<@${report.target_id}>`);
  embed.addField(translate('guild_report_log.title'), lines.join('\n'));
  if (messageLines.length) {
    embed.addField(translate('guild_report_log.message'), messageLines.join('\n'));
  }
  embed.setFooter(`${footer} • ${createTimestampStringFromGuild(created, report.guild_id)}`);
  createReportButtons(translator, report, components);
  return {allowedMentions: {parse: []}, components, embeds: [sanitizeEmbed(embed)]};
}


// the buttons on a reports logger's message, for anyone who can time out members (same as `warn`). they still work after a
// restart since everything's in the custom id, and two moderators pressing at once just both see it handled
export async function onGuildReportComponent(context: ComponentContext, action: string, reportId: string) {
  // cached only, the click has to be answered quickly
  const { translate, translateMaybe } = getCachedTranslator(context);
  const status = ReportActionStatuses[action];
  if (status === undefined || !context.guildId) {
    return context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  }
  if (!context.member || !context.member.can(Permissions.MODERATE_MEMBERS)) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `${StatusEmojis.WARNING} ${translate('guild_report_log.no_permission')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  let report: RestResponsesRaw.GuildReport;
  try {
    report = await editGuildReport(context, context.guildId, reportId, {moderatorId: context.userId, status});
  } catch(error) {
    const apiError = await getApiError(error);
    if (!apiError) {
      throw error;
    }
    const key = getApiErrorTranslationKey(apiError.code);
    return context.createMessage({
      content: `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  dropQueuedGuildReportUpdate(context.guildId, report.id);

  // redrawn the way it was sent, the server could have changed its display setting since
  const message = context.interaction.message;
  const componentsV2 = !!message && (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2;
  const target = await fetchUser(context.client, report.target_id);
  const { flags, ...payload } = createReportLogMessage(getReportLogTranslator(context.client, report.guild_id), report, target, componentsV2);
  return context.editResponse(payload);
}
