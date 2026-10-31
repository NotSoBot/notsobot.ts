import { ClusterClient, Command, Interaction, ShardClient, Structures } from 'detritus-client';
import {
  DiscordAbortCodes,
  InteractionCallbackTypes,
  MarkupTimestampStyles,
  MessageComponentButtonStyles,
  MessageComponentInputTextStyles,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';
import {
  ComponentContext,
  Components,
  Embed,
  InteractionModal,
  InteractionModalArgs,
  InteractionModalContext,
  Markup,
} from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import {
  createGuildReport,
  createGuildReportMessage,
  editGuildReport,
  editGuildReportLogMessages,
  fetchGuildReportQuote,
  putGuildReportMember,
  putGuildReportReporterMuted,
  putGuildReportQuote,
} from '../../../api';
import { Domains } from '../../../api/endpoints';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { GuildSettingsLogger } from '../../../api/structures/guildsettings';
import { RestResponsesRaw } from '../../../api/types';
import GuildLoggingListener from '../../../listeners/guildlogging';
import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';
import {
  EmbedColors,
  GuildLoggerTypes,
  GuildReportTypes,
  GuildSettingsResponseDisplayTypes,
  MAX_GUILD_REPORT_MESSAGE_CONTENT_LENGTH,
  MAX_GUILD_REPORT_MESSAGE_LENGTH,
  MessageComponentCustomIds,
  ReportStatuses,
  StatusEmojis,
  UserSettingsResponseDisplayTypes,
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
  fetchMemberOrUserById,
} from '../../../utils';

import { createQuoteMemberOptions, createQuoteOptions } from './fun.quote';
import { findResponseInvoker } from './report';
import {
  ContainerSection,
  addContainerBody,
  addContainerGallery,
  addContainerFooter,
  addContainerHeader,
  createContainerTitle,
  createFooterTimestamp,
  createUserHeaderLines,
  sanitizeEmbed,
  truncate,
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

// the button's `guild-report.{action}.{reportId}` and the status it sets, `respond` opens a modal instead
const REPORT_ACTION_RESPOND = 'respond';
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

// a report resolved or dismissed DMs its reporter after this long, so a misclick that's undone right away (reopened, or
// switched between resolve and dismiss) only sends where it ended up, or nothing
const REPORTER_NOTICE_DELAY = 30000;
// the reports waiting to DM their reporter, by report id, with when the latest change was made
const reporterNotices = new Map<string, {created: number, timeout: ReturnType<typeof setTimeout>}>();

// the reporter can't see the conversation anywhere but their DMs, so a whole reply (`MAX_GUILD_REPORT_MESSAGE_LENGTH`) always
// fits: in an embed field (1024) and, with the report's preview, in a 2000 character text message
const MAX_DM_REPORT_PREVIEW_LENGTH = 300;
// how long the report's thread stays open without messages, a week (the longest discord has)
const THREAD_AUTO_ARCHIVE_DURATION = 10080;
// "A thread has already been created for this message", not in detritus' codes
const THREAD_ALREADY_CREATED = 160004;
// the reported message's quote on a logger message, redraws keep it (edits without `attachments` keep the old ones) and
// point at it again
const REPORT_QUOTE_FILENAME = 'quote.png';


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
    // our own responses are reported for whoever used the command. their own response is a bug report, it stays on us
    // (so does one whose user is gone)
    if (message.fromMe) {
      const invoker = await findResponseInvoker(context, message);
      const found = (invoker && invoker.userId !== context.userId) ? await fetchMemberOrUserById(context, invoker.userId) : null;
      if (found) {
        target = (found instanceof Structures.Member) ? found.user : found;
      }
    }
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

  // after they're answered, drawing them takes a moment. a member report's member as they look in this server (their
  // nickname), the user when they aren't in it. a message report's quote already shows its author
  const member = (message) ? null : (args.user || target);
  saveReportImages(context, report, member, message).catch((error) => {
    console.error(`Guild Report ${report.id} failed to save its images for ${report.guild_id}`, error);
  });

  return {payload: {description: `${StatusEmojis.YES} ${translate('guild_report.sent')}`, ephemeral: true}, report};
}


// an image of the reported member (member reports) or message (message reports, drawn like `quote` with its images,
// embed and author too) as they looked, kept for the dashboard, and the message's goes on its logger messages too. when
// the api's scan flags one, it's kept drawn without its images. in the server's language, it's for the moderators
async function saveReportImages(
  context: Command.Context | Interaction.InteractionContext,
  report: RestResponsesRaw.GuildReport,
  member: null | Structures.Member | Structures.User,
  message: null | Structures.Message,
): Promise<void> {
  if (member) {
    await putGuildReportMember(context, report.guild_id, report.id, createQuoteMemberOptions(member));
  }
  if (message) {
    const translator = getReportLogTranslator(context.client, report.guild_id);
    const options = await createQuoteOptions(context, translator, message, {absoluteTime: true});
    if (options) {
      const response = await putGuildReportQuote(context, report.guild_id, report.id, options);
      if (response.image && response.report && response.log_messages) {
        await attachReportQuote(context.client, response.report, response.log_messages, Buffer.from(response.image, 'base64'));
      }
    }
  }
}


// the quote replaces the message's text on each of the report's logger messages, drawn with the report as the api has it
// now (a moderator could've handled it while it was drawn). a failed edit just leaves the text
async function attachReportQuote(
  shard: ShardClient,
  report: RestResponsesRaw.GuildReport,
  logMessages: Array<RestResponsesRaw.GuildReportLogMessage>,
  buffer: Buffer,
): Promise<void> {
  const settings = await GuildSettingsStore.getOrFetch({client: shard}, report.guild_id);
  if (!settings) {
    return;
  }
  const translator = getReportLogTranslator(shard, report.guild_id);
  const target = await fetchUser(shard, report.target_id);
  for (let logMessage of logMessages) {
    const logger = settings.loggers.find((logger) => {
      return logger.type === GuildLoggerTypes.REPORTS && logger.webhookId === logMessage.webhook_id;
    });
    if (!logger || !logger.webhookId || !logger.webhookToken) {
      continue;
    }
    try {
      const message = await shard.rest.fetchWebhookTokenMessage(logger.webhookId, logger.webhookToken, logMessage.message_id);
      const componentsV2 = (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2;
      const { flags, ...options } = createReportLogMessage(translator, report, target, componentsV2, true);
      await shard.rest.editWebhookTokenMessage(logger.webhookId, logger.webhookToken, logMessage.message_id, {
        ...options,
        files: [{filename: REPORT_QUOTE_FILENAME, value: buffer}],
        withComponents: true,
      });
    } catch(error) {
      if (error.code !== DiscordAbortCodes.UNKNOWN_MESSAGE && error.code !== DiscordAbortCodes.UNKNOWN_WEBHOOK) {
        console.error(`Guild Report ${report.id} failed to add its quote to ${logMessage.message_id} for ${report.guild_id}`, error);
      }
    }
  }
}


// whether a logger message already has the report's quote, so a redraw shows it instead of the text
function hasReportQuote(message: null | Structures.Message | undefined): boolean {
  return !!message && message.attachments.some((attachment) => attachment.filename === REPORT_QUOTE_FILENAME);
}

// a redraw keeps the quote that's on the message, or adds the api's when the message doesn't have it (posted before it
// was drawn, or adding it failed). `files` is what to upload with the edit, the quote's fetched once per redraw (`cache`)
async function getReportQuoteRedraw(
  shard: ShardClient,
  report: RestResponsesRaw.GuildReport,
  message: null | Structures.Message | undefined,
  cache: {buffer?: Buffer | null},
): Promise<{hasQuote: boolean, files?: Array<{filename: string, value: Buffer}>}> {
  if (hasReportQuote(message)) {
    return {hasQuote: true};
  }
  if (report.type !== GuildReportTypes.MESSAGE || !report.message_quote) {
    return {hasQuote: false};
  }
  if (cache.buffer === undefined) {
    try {
      cache.buffer = await fetchGuildReportQuote({client: shard}, report.guild_id, report.id);
    } catch(error) {
      console.error(`Guild Report ${report.id} failed to fetch its quote for ${report.guild_id}`, error);
      cache.buffer = null;
    }
  }
  return (cache.buffer) ? {hasQuote: true, files: [{filename: REPORT_QUOTE_FILENAME, value: cache.buffer}]} : {hasQuote: false};
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
  const results = await Promise.allSettled(loggers.map((logger) => GuildLoggingListener.execute(shard, logger, {...payload, wait: true})));
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
  const shard = shardForGuild(cluster, report.guild_id);
  if (!shard) {
    return;
  }
  queueReporterNotice(shard, report, payload.created);
  if (!payload.log_messages.length) {
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
  const quoteCache: {buffer?: Buffer | null} = {};
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
      const quote = await getReportQuoteRedraw(shard, report, message, quoteCache);
      const { flags, ...options } = createReportLogMessage(translator, report, target, componentsV2, quote.hasQuote);
      await shard.rest.editWebhookTokenMessage(logger.webhookId, logger.webhookToken, logMessage.message_id, {
        ...options,
        files: quote.files,
        withComponents: true,
      });
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

// who reported it and why, then "`id` • Resolved by @moderator • 5 minutes ago" (or just "Open"), and a warning while the
// reporter's reply is the last one (replying doesn't reopen a handled report, so it'd be easy to miss)
function getReportLines(translator: Translator, report: RestResponsesRaw.GuildReport): Array<string> {
  const { translate } = translator;
  const status = getStatusText(translate, report.status);
  const lines = [
    `**${translate('guild_report_log.reported_by')}**: <@${report.user_id}>`,
    `**${translate('logger.reason')}**: ${Markup.codeblock(report.reason)}`,
    displayDetailsLine([
      Markup.codestring(report.id),
      (report.handled_by) ? translate('guild_report_log.handled', {status, user: `<@${report.handled_by}>`}) : status,
      (report.handled_at) && displayTimestamp(Date.parse(report.handled_at)),
    ], true),
  ];
  if (report.last_reply && report.last_reply.author === 'reporter') {
    lines.push(`${StatusEmojis.WARNING} ${translate('guild_report_log.waiting', {when: displayTimestamp(Date.parse(report.last_reply.created))})}`);
  }
  return lines;
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

// the report on the server's dashboard, opened over its Reports section
export function getReportDashboardUrl(report: RestResponsesRaw.GuildReport): string {
  return `${Domains.STABLE}/dashboard/servers/${report.guild_id}/reports?report=${report.id}`;
}

// open: resolve and dismiss, handled: reopen, then respond (to the reporter), the report on the dashboard and the reported
// message for message reports
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
  row.createButton({customId: customId(REPORT_ACTION_RESPOND), label: translate('report_respond.button'), style: MessageComponentButtonStyles.PRIMARY});
  row.createButton({label: translate('report_message_dm.view_report'), url: getReportDashboardUrl(report)});
  const url = getReportMessageUrl(report);
  if (url) {
    row.createButton({label: translate('guild_report_log.jump'), url});
  }
}

// laid out like the moderation logger: the reported member's header with the report next to their avatar, the reported
// message under it (its quote once it's attached, `REPORT_QUOTE_FILENAME`, the text before that or without one), what
// kind of report it is in the footer and the status as the side color
export function createReportLogMessage(
  translator: Translator,
  report: RestResponsesRaw.GuildReport,
  target: Structures.User | null,
  componentsV2: boolean,
  hasQuote: boolean = false,
): {allowedMentions: {parse: []}, components: Components, embeds?: Array<Embed>, flags?: number} {
  const { translate } = translator;
  const color = ReportStatusColors[report.status] ?? EmbedColors.DEFAULT;
  const footer = (report.type === GuildReportTypes.MESSAGE)
    ? translate('guild_report_log.footer_message')
    : translate('guild_report_log.footer_user');
  const created = Date.parse(report.created);
  const lines = getReportLines(translator, report);
  const quoteUrl = (hasQuote && report.type === GuildReportTypes.MESSAGE) ? `attachment://${REPORT_QUOTE_FILENAME}` : null;
  const messageLines = (quoteUrl) ? [] : getMessageLines(translator, report);

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
    if (quoteUrl) {
      // components v2 only shows an attachment a component points at
      addContainerGallery(container, [{url: quoteUrl}], translate('guild_report_log.message'));
    }
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
  if (quoteUrl) {
    embed.setImage(quoteUrl);
  }
  embed.setFooter(`${footer} • ${createTimestampStringFromGuild(created, report.guild_id)}`);
  createReportButtons(translator, report, components);
  return {allowedMentions: {parse: []}, components, embeds: [sanitizeEmbed(embed)]};
}


// the buttons on a reports logger's message, for anyone who can time out members (same as `warn`). they still work after a
// restart since everything's in the custom id, and two moderators pressing at once just both see it handled
export async function onGuildReportComponent(context: ComponentContext, action: string, reportId: string) {
  // cached only, the click has to be answered quickly
  const translator = getCachedTranslator(context);
  const { translate, translateMaybe } = translator;
  const status = ReportActionStatuses[action];
  if ((status === undefined && action !== REPORT_ACTION_RESPOND) || !context.guildId) {
    return context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  }
  if (!context.member || !context.member.can(Permissions.MODERATE_MEMBERS)) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `${StatusEmojis.WARNING} ${translate('guild_report_log.no_permission')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  if (action === REPORT_ACTION_RESPOND) {
    const guildId = context.guildId;
    // a modal has to be the first response, so it can't be deferred
    return context.respond(createRespondModal(translator, {
      description: translate('guild_report_respond.modal_description_moderator'),
      maxLength: MAX_GUILD_REPORT_MESSAGE_LENGTH,
      title: translate('guild_report_respond.modal_title'),
      onSubmit: async (content) => {
        await createGuildReportMessage(context, guildId, reportId, {authorId: context.userId, content, moderator: true});
        return translate('guild_report_respond.sent_moderator');
      },
    }));
  }

  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  let report: RestResponsesRaw.EditGuildReport;
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
  if (report.changed) {
    queueReporterNotice(context.client, report, Date.now());
  }

  // redrawn the way it was sent, the server could have changed its display setting since
  const message = context.interaction.message;
  const componentsV2 = !!message && (message.flags & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2;
  const target = await fetchUser(context.client, report.target_id);
  const quote = await getReportQuoteRedraw(context.client, report, message, {});
  const { flags, ...payload } = createReportLogMessage(getReportLogTranslator(context.client, report.guild_id), report, target, componentsV2, quote.hasQuote);
  return context.editResponse({...payload, files: quote.files});
}


// a Respond button's modal, one paragraph. `onSubmit` sends it and gives what to tell them (ephemeral), an api error
// (like being over the hourly limit) is shown instead
export function createRespondModal(
  translator: Translator,
  options: {description: string, maxLength: number, title: string, onSubmit: (content: string) => Promise<string>},
): InteractionModal {
  const { translate, translateMaybe } = translator;
  const modal = new InteractionModal({
    title: options.title,
    run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      const content = await options.onSubmit((args.content || '').trim());
      return modalContext.editOrRespond({content: `${StatusEmojis.YES} ${content}`, flags: MessageFlags.EPHEMERAL});
    },
    onError: async (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
      const apiError = await getApiError(error);
      let content: string;
      if (apiError) {
        const key = getApiErrorTranslationKey(apiError.code);
        content = (key) ? translateMaybe(key, apiError.message) : apiError.message;
      } else {
        console.error(`Failed to send a report response from ${modalContext.userId}`, error);
        content = String((error && error.message) || error);
      }
      return modalContext.editOrRespond({content: `${StatusEmojis.WARNING} ${content}`, flags: MessageFlags.EPHEMERAL});
    },
  });
  modal.createLabel({
    description: options.description,
    label: translate('report_respond.modal_message'),
  }).createInputText({
    customId: 'content',
    maxLength: options.maxLength,
    required: true,
    style: MessageComponentInputTextStyles.PARAGRAPH,
  });
  return modal;
}


// no command to take these from, so it's the user's own settings or the defaults
export async function fetchDmSettings(
  shard: ShardClient,
  userId: string,
): Promise<{display: UserSettingsResponseDisplayTypes, translator: Translator}> {
  const settings = await UserSettingsStore.getOrFetch({client: shard}, userId);
  const display = (settings && typeof(settings.response_display) === 'number')
    ? settings.response_display as UserSettingsResponseDisplayTypes
    : UserSettingsResponseDisplayTypes.DEFAULT;
  const translator = getTranslatorForLanguage(languageFromLocale(settings && settings.locale) || Languages.ENGLISH);
  return {display, translator};
}


// the reporter's Respond button in their DMs, the api only takes it on their own report
export function onGuildReportRespondComponent(context: ComponentContext, guildId: string, reportId: string) {
  const translator = getCachedTranslator(context);
  const { translate } = translator;
  return context.respond(createRespondModal(translator, {
    description: translate('guild_report_respond.modal_description_reporter'),
    maxLength: MAX_GUILD_REPORT_MESSAGE_LENGTH,
    title: translate('guild_report_respond.modal_title'),
    onSubmit: async (content) => {
      await createGuildReportMessage(context, guildId, reportId, {authorId: context.userId, content, moderator: false});
      return translate('guild_report_respond.sent_reporter');
    },
  }));
}


// the Stop DMs button on the reporter's DMs, the api only takes it on their own report. Their reports on the dashboard is
// where they turn it back on
export async function onGuildReportMuteComponent(context: ComponentContext, guildId: string, reportId: string) {
  const { translate, translateMaybe } = getCachedTranslator(context);
  await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
  try {
    await putGuildReportReporterMuted(context, guildId, reportId, {muted: true, userId: context.userId});
  } catch(error) {
    const apiError = await getApiError(error);
    if (!apiError) {
      throw error;
    }
    const key = getApiErrorTranslationKey(apiError.code);
    return context.editOrRespond({content: `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`});
  }
  const components = new Components();
  components.createActionRow().createButton({label: translate('report_message_dm.view_report'), url: `${Domains.STABLE}/dashboard/reports?tab=servers`});
  return context.editOrRespond({components, content: `${StatusEmojis.YES} ${translate('guild_report_dm.muted')}`});
}


// resolved or dismissed from a button or the dashboard, DMed after `REPORTER_NOTICE_DELAY` with whatever it is then. only
// the cluster with the server's shard gets here
function queueReporterNotice(shard: ShardClient, report: RestResponsesRaw.GuildReport, created: number): void {
  const queued = reporterNotices.get(report.id);
  if (queued) {
    if (created < queued.created) {
      return;
    }
    clearTimeout(queued.timeout);
  }
  const timeout = setTimeout(() => {
    reporterNotices.delete(report.id);
    if (report.status === ReportStatuses.OPEN || report.reporter_muted) {
      return;
    }
    sendReporterDm(shard, report, null).catch((error) => {
      // closed dms (or a deleted account) are expected
      if (error.code !== DiscordAbortCodes.INVALID_MESSAGE_SEND_USER) {
        console.error(`Failed to DM guild report ${report.id}'s status to ${report.user_id}`, error);
      }
    });
  }, REPORTER_NOTICE_DELAY);
  reporterNotices.set(report.id, {created, timeout});
}


// a reply on a report from either side (the bot's Respond buttons or the dashboard). a moderator's is DMed to the reporter
// as "the moderators", then either side's goes in the report's thread on each of its logger messages
export async function onGuildReportMessageCreate(cluster: ClusterClient, payload: RedisPayloads.GuildReportMessageCreate): Promise<void> {
  const { message, report } = payload;
  const shard = shardForGuild(cluster, report.guild_id);
  // TODO: remove once replies are reaching Discord, a trace of each step (`[guild report reply]` to grep for)
  const trace = (step: string) => console.log(`[guild report reply] ${report.id}/${message.id} cluster ${cluster.clusterId}: ${step}`);
  trace(`received (author ${message.author}, shard ${(shard) ? shard.shardId : 'not on this cluster'}, ${payload.log_messages.length} log messages, content ${(message.content) ? 'yes' : 'no'})`);
  if (!shard || !message.content) {
    return;
  }
  // why the reporter wasn't DMed the moderators' reply, noted in the thread
  let dmNote: null | 'failed' | 'muted' = null;
  if (message.author === 'moderator' && report.reporter_muted) {
    dmNote = 'muted';
    trace('dm skipped, the reporter muted it');
  } else if (message.author === 'moderator') {
    try {
      await sendReporterDm(shard, report, message);
      trace('dm sent');
    } catch(error) {
      dmNote = 'failed';
      trace(`dm failed (${error.code ?? error.message})`);
      if (error.code !== DiscordAbortCodes.INVALID_MESSAGE_SEND_USER) {
        console.error(`Failed to DM guild report ${report.id}'s reply ${message.id} to ${report.user_id}`, error);
      }
    }
  }
  await postReportThreadMessages(shard, payload, dmNote);
  trace('thread posts done');
  // the report's messages show whether it's waiting on the moderators, which every reply changes
  await updateReportLogMessages(cluster, {created: Date.now(), log_messages: payload.log_messages, moderator_id: '', report});
}


async function sendReporterDm(
  shard: ShardClient,
  report: RestResponsesRaw.GuildReport,
  message: RestResponsesRaw.GuildReportMessage | null,
): Promise<void> {
  const { display, translator } = await fetchDmSettings(shard, report.user_id);
  const guild = shard.guilds.get(report.guild_id);
  const channel = await shard.rest.createDm({recipientId: report.user_id});
  await shard.rest.createMessage(channel.id, createReporterDm(translator, display, report, (guild) ? guild.name : null, message));
}


// laid out like the DMs about reports to the developers: what happened as the header with the report's info, the report
// and the moderators' reply as titled sections, then the event in the footer, with the status as the side color and the
// Respond button (and Jump to Message) under it.
// the moderator is never named, it's "the moderators" of the server
function createReporterDm(
  translator: Translator,
  display: UserSettingsResponseDisplayTypes,
  report: RestResponsesRaw.GuildReport,
  guildName: null | string,
  message: RestResponsesRaw.GuildReportMessage | null,
): Record<string, any> {
  const { translate } = translator;
  const color = ReportStatusColors[report.status] ?? EmbedColors.DEFAULT;
  let title: string;
  if (message) {
    title = translate('guild_report_dm.title_reply');
  } else if (report.status === ReportStatuses.DISMISSED) {
    title = translate('guild_report_dm.title_dismissed');
  } else {
    title = translate('guild_report_dm.title_resolved');
  }
  const information = [
    `**${translate('guild_report_dm.server')}**: ${(guildName) ? Markup.escape.all(guildName) : Markup.codestring(report.guild_id)}`,
    `**${translate('report_message_dm.reported')}**: <@${report.target_id}>`,
    `**${translate('report_message_dm.report_id')}**: ${Markup.codestring(report.id)}`,
    `**${translate('common.created')}**: ${Markup.timestamp(Date.parse(report.created), MarkupTimestampStyles.RELATIVE)}`,
  ];
  const reply = (message && message.content) ? Markup.codeblock(truncate(message.content, MAX_GUILD_REPORT_MESSAGE_LENGTH)) : null;
  const reportContent = Markup.codeblock(truncate(report.reason, MAX_DM_REPORT_PREVIEW_LENGTH));
  const footer = (message) ? translate('guild_report_dm.footer_reply') : translate('report_message_dm.footer_status');
  const happenedAt = (message) ? message.created : (report.handled_at || new Date().toISOString());
  const happened = Markup.timestamp(Date.parse(happenedAt), MarkupTimestampStyles.BOTH_SHORT);

  const respondButton = {
    customId: `${MessageComponentCustomIds.GUILD_REPORT_RESPOND}.${report.guild_id}.${report.id}`,
    label: translate('report_respond.button'),
    style: MessageComponentButtonStyles.PRIMARY,
  };
  const jumpUrl = getReportMessageUrl(report);
  // under the message in every layout, like the DMs about reports to the developers
  const addButtons = (components: Components) => {
    const row = components.createActionRow();
    row.createButton(respondButton);
    // turns these DMs off for this report, the report stays and they can still see it on their dashboard
    row.createButton({
      customId: `${MessageComponentCustomIds.GUILD_REPORT_MUTE}.${report.guild_id}.${report.id}`,
      label: translate('guild_report_dm.mute'),
      style: MessageComponentButtonStyles.SECONDARY,
    });
    if (jumpUrl) {
      row.createButton({label: translate('guild_report_log.jump'), url: jumpUrl});
    }
  };

  const allowedMentions = {parse: []};
  switch (display) {
    case UserSettingsResponseDisplayTypes.LEGACY: {
      const embed = new Embed();
      embed.setColor(color);
      embed.setTitle(title);
      embed.setDescription(information.join('\n'));
      // their report first, then what the moderators said about it
      embed.addField(translate('report_message_dm.your_report'), reportContent);
      if (reply) {
        embed.addField(translate('guild_report_dm.reply'), reply);
      }
      embed.setFooter(footer);
      embed.setTimestamp(happenedAt);

      const components = new Components();
      addButtons(components);
      return {allowedMentions, components, embed: sanitizeEmbed(embed)};
    };
    case UserSettingsResponseDisplayTypes.NO_EMBED: {
      // no side color in text, the title has what happened
      const lines = [`**${title}**`, ...information, `**${translate('report_message_dm.your_report')}**`, reportContent];
      if (reply) {
        lines.push(`**${translate('guild_report_dm.reply')}**`, reply);
      }
      lines.push(`-# ${footer} • ${happened}`);

      const components = new Components();
      addButtons(components);
      return {allowedMentions, components, content: lines.join('\n')};
    };
  }

  const components = new Components();
  const container = components.createContainer();
  container.setAccentColor(color);
  container.addTextDisplay({content: [createContainerTitle(title), ...information].join('\n')});
  container.addSeparator();
  const sections: Array<ContainerSection> = [{title: translate('report_message_dm.your_report'), lines: [reportContent]}];
  if (reply) {
    sections.push({title: translate('guild_report_dm.reply'), lines: [reply]});
  }
  addContainerBody(container, sections);
  addContainerFooter(container, `${footer} • ${happened}`);
  addButtons(components);
  return {allowedMentions, components, flags: MessageFlags.IS_COMPONENTS_V2};
}


// one message per logger message, in the thread on it (made the first time). without permission to make threads there it
// goes in the channel instead, with a link to the report's message
async function postReportThreadMessages(
  shard: ShardClient,
  payload: RedisPayloads.GuildReportMessageCreate,
  dmNote: null | 'failed' | 'muted',
): Promise<void> {
  const { report } = payload;
  // TODO: remove with the trace in `onGuildReportMessageCreate`
  const trace = (step: string) => console.log(`[guild report reply] ${report.id}/${payload.message.id}: ${step}`);
  if (!payload.log_messages.length) {
    trace('no log messages saved on the report, no thread');
    return;
  }
  const settings = await GuildSettingsStore.getOrFetch({client: shard}, report.guild_id);
  if (!settings) {
    trace('no guild settings, no thread');
    return;
  }
  const componentsV2 = !!settings.settings && (settings.settings.responseDisplay ?? GuildSettingsResponseDisplayTypes.DEFAULT) === GuildSettingsResponseDisplayTypes.DEFAULT;
  const translator = getReportLogTranslator(shard, report.guild_id);
  const target = await fetchUser(shard, report.target_id);
  // "Report 1300000000000000404: username", the id first so a long username can't truncate it away
  const threadName = truncate(`${translator.translate('guild_report_log.title')} ${report.id}: ${(target) ? target.username : report.target_id}`, 100);
  for (let logMessage of payload.log_messages) {
    const logger = settings.loggers.find((logger) => {
      return logger.type === GuildLoggerTypes.REPORTS && logger.webhookId === logMessage.webhook_id;
    });
    if (!logger || !logger.webhookId || !logger.webhookToken) {
      trace(`no reports logger with webhook ${logMessage.webhook_id} anymore, skipped ${logMessage.message_id}`);
      continue;
    }
    const create = (inThread: boolean) => {
      // outside the thread it links to the report's message
      const reportUrl = (inThread) ? null : DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(report.guild_id, logMessage.channel_id, logMessage.message_id);
      return createReportThreadMessage(translator, payload, dmNote, componentsV2, reportUrl);
    };
    try {
      await executeInReportThread(shard, logger, logMessage, threadName, create);
      trace(`posted for ${logMessage.message_id}`);
    } catch(error) {
      trace(`posting for ${logMessage.message_id} failed (${error.code ?? error.message})`);
      if (error.code !== DiscordAbortCodes.UNKNOWN_MESSAGE && error.code !== DiscordAbortCodes.UNKNOWN_WEBHOOK) {
        console.error(`Guild Report ${report.id} failed to post its reply ${payload.message.id} for ${report.guild_id}`, error);
      }
    }
  }
}

async function executeInReportThread(
  shard: ShardClient,
  logger: GuildSettingsLogger,
  logMessage: RestResponsesRaw.GuildReportLogMessage,
  threadName: string,
  create: (inThread: boolean) => ReturnType<typeof createReportThreadMessage>,
) {
  // a thread made from a message has the message's id
  const threadId = logMessage.message_id;
  try {
    return await GuildLoggingListener.execute(shard, logger, {...create(true), threadId, wait: true});
  } catch(error) {
    if (error.code !== DiscordAbortCodes.UNKNOWN_CHANNEL) {
      throw error;
    }
  }
  try {
    await shard.rest.createChannelMessageThread(logMessage.channel_id, logMessage.message_id, {
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_DURATION,
      name: threadName,
    });
  } catch(error) {
    if (error.code === DiscordAbortCodes.UNKNOWN_MESSAGE) {
      throw error;
    }
    // no Create Public Threads there (or a channel that can't have them), so it goes in the channel
    if (error.code !== THREAD_ALREADY_CREATED) {
      return GuildLoggingListener.execute(shard, logger, {...create(false), wait: true});
    }
  }
  return GuildLoggingListener.execute(shard, logger, {...create(true), threadId, wait: true});
}

// "@moderator replied to the reporter" (or "The reporter, @member, replied") with the reply, in the server's display format
// like the report's own message, and the Respond button for the moderators
function createReportThreadMessage(
  translator: Translator,
  payload: RedisPayloads.GuildReportMessageCreate,
  dmNote: null | 'failed' | 'muted',
  componentsV2: boolean,
  // outside the thread, a link to the report's message
  reportUrl: null | string,
): {allowedMentions: {parse: []}, components: Components, embeds?: Array<Embed>, flags?: number} {
  const { translate } = translator;
  const { message, report } = payload;
  const color = ReportStatusColors[report.status] ?? EmbedColors.DEFAULT;
  const header = (message.author === 'moderator')
    ? translate('guild_report_thread.moderator_replied', {user: `<@${message.author_id}>`})
    : translate('guild_report_thread.reporter_replied', {user: `<@${report.user_id}>`});
  const reply = Markup.codeblock(truncate(message.content || '', MAX_GUILD_REPORT_MESSAGE_LENGTH));
  const notes: Array<string> = [];
  if (dmNote === 'failed') {
    notes.push(`-# ${StatusEmojis.WARNING} ${translate('guild_report_thread.dm_failed')}`);
  } else if (dmNote === 'muted') {
    notes.push(`-# ${translate('guild_report_thread.muted')}`);
  }
  if (reportUrl) {
    notes.push(`-# ${translate('guild_report_thread.report', {report: Markup.url(report.id, reportUrl)})}`);
  }

  const components = new Components();
  const addRespond = () => {
    components.createActionRow().createButton({
      customId: `${MessageComponentCustomIds.GUILD_REPORT}.${REPORT_ACTION_RESPOND}.${report.id}`,
      label: translate('report_respond.button'),
      style: MessageComponentButtonStyles.PRIMARY,
    });
  };
  if (componentsV2) {
    const container = components.createContainer();
    container.setAccentColor(color);
    container.addTextDisplay({content: [header, reply, ...notes].join('\n')});
    addRespond();
    // text displays actually ping, unlike embeds
    return {allowedMentions: {parse: []}, components, flags: MessageFlags.IS_COMPONENTS_V2};
  }

  const embed = new Embed();
  embed.setColor(color);
  embed.setDescription([header, reply, ...notes].join('\n'));
  embed.setTimestamp(message.created);
  addRespond();
  return {allowedMentions: {parse: []}, components, embeds: [sanitizeEmbed(embed)]};
}
