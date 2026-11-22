import { Command, Interaction, ShardClient, Structures } from 'detritus-client';
import { ChannelTypes, OverwriteTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { adoptGuildDecoyNotice, deleteGuildDecoy, editGuildDecoy, fetchGuildDecoy, putGuildDecoy } from '../../../api';
import { RestOptions, RestResponsesRaw } from '../../../api/types';
import DecoyStore from '../../../stores/decoys';
import GuildSettingsStore from '../../../stores/guildsettings';
import { BAN_CLEAN_DEFAULT, BAN_CLEAN_MAX, DECOY_GRACE_TIME, EmbedColors, GuildWarningAutoTriggers, StatusEmojis } from '../../../constants';
import { createDecoyWebhookName, generateDecoyChannelName, pickDecoyNotice } from '../../decoy';
import { Translator, getCachedTranslator, getGuildTranslator, getTranslator } from '../../i18n';
import { Parameters, displayDetailsLine, displayReply, displayTimestamp, formatDuration, formatUserTag } from '../../../utils';

import { formatWarningWeight, resolveGuildWarningAuto } from './moderation.autowarn';
import { DM_OFF_VALUES, DM_ON_VALUES } from './settings.server.set.dms';
import { UserError } from '../../errors';


export const COMMAND_ID = 'server.decoy.status';
export const COMMAND_ID_CREATE = 'server.decoy.create';
export const COMMAND_ID_NOTICE = 'server.decoy.notice';
export const COMMAND_ID_REMOVE = 'server.decoy.remove';
export const COMMAND_ID_RENAME = 'server.decoy.rename';
export const COMMAND_ID_SETTINGS = 'server.decoy.settings';

// the bait's average time between messages (the api's limits)
export const BAIT_INTERVAL_MIN = 10 * 60;
export const BAIT_INTERVAL_MAX = 24 * 60 * 60;
// the bot's own notice, a message's limit
export const NOTICE_MAX_LENGTH = 2000;
export const GRACE_TIME = DECOY_GRACE_TIME;
export const TOPIC_MAX_LENGTH = 1024;
// discord lets a channel be renamed twice every 10 minutes, a third waits out the rest (longer than an interaction lasts)
const RENAME_LIMIT = 2;
const RENAME_WINDOW = 10 * 60 * 1000;

// what the bot needs where the channel is made, and in it
const CREATE_PERMISSIONS = [Permissions.MANAGE_CHANNELS, Permissions.MANAGE_WEBHOOKS, Permissions.BAN_MEMBERS, Permissions.MANAGE_MESSAGES];
// everyone can see and post (posting is the point), threads and reactions are a way around the one message rule
const EVERYONE_ALLOW = Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGES | Permissions.ATTACH_FILES | Permissions.READ_MESSAGE_HISTORY;
const EVERYONE_DENY = Permissions.ADD_REACTIONS | Permissions.CREATE_PUBLIC_THREADS | Permissions.CREATE_PRIVATE_THREADS |
  Permissions.SEND_MESSAGES_IN_THREADS;
// reactions and external emojis for the warning I react to a post with (an app emoji), everyone else's are denied
const BOT_ALLOW = Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGES | Permissions.READ_MESSAGE_HISTORY |
  Permissions.MANAGE_WEBHOOKS | Permissions.MANAGE_MESSAGES | Permissions.ADD_REACTIONS | Permissions.USE_EXTERNAL_EMOJIS;

// channel id -> when it was renamed
const renames = new Map<string, Array<number>>();


type Context = Command.Context | Interaction.InteractionContext;

function warn(context: Context, text: string) {
  return displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true});
}


// the server's decoy from the store, fetched when the store isn't loaded yet
export async function getGuildDecoy(context: {client: ShardClient}, guildId: string): Promise<RestResponsesRaw.GuildDecoy | null> {
  if (DecoyStore.loader.isLoaded) {
    return DecoyStore.get(guildId) || null;
  }
  const { decoy } = await fetchGuildDecoy(context, guildId);
  return decoy;
}

// changes it in the api and this cluster's copy
export async function editDecoy(
  context: {client: ShardClient},
  guildId: string,
  options: RestOptions.GuildDecoyFields,
): Promise<RestResponsesRaw.GuildDecoy> {
  const { decoy } = await editGuildDecoy(context, guildId, options);
  DecoyStore.apply(decoy, guildId);
  return decoy;
}


// the member waited on posted the notice: theirs if they still are (the api decides, under its lock)
export async function adoptNotice(
  context: {client: ShardClient},
  guildId: string,
  userId: string,
  messageId: string,
): Promise<RestResponsesRaw.AdoptGuildDecoyNotice> {
  const result = await adoptGuildDecoyNotice(context, guildId, userId, messageId);
  DecoyStore.apply(result.decoy, guildId);
  return result;
}


// the bot's own notice: the server's text or the default, in the server's language
export function getBotNoticeContent(translator: Translator, decoy: Pick<RestResponsesRaw.GuildDecoy, 'notice_content'>): string {
  return decoy.notice_content || translator.translate('decoy.notice_default');
}

export async function postBotNotice(channel: Structures.Channel, content: string): Promise<Structures.Message> {
  return channel.createMessage({allowedMentions: {parse: []}, content});
}


// a codeblock to copy, so the moderator's notice isn't the same as every other server's
function formatSuggestedNotice(translator: Translator, language: string): Array<string> {
  return [
    translator.translate('decoy.post_it_yourself_suggestion'),
    Markup.codeblock(pickDecoyNotice(language)),
  ];
}


export interface CreateArgs {
  // the category it goes in, uncategorized (at the very top) without one
  in?: Structures.Channel | null,
  // the channel's name, generated in the server's style without one
  name?: string,
  // bot: I post the default notice, me: the next message from `from` (or them) becomes it
  notice?: 'bot' | 'me',
  from?: Structures.Member | Structures.User | null,
}

export async function createCreateMessage(context: Context, args: CreateArgs) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const guild = context.guild!;
  const me = guild.me;
  const category = (args.in) ? (context.guild!.channels.get(args.in.id) || args.in) : null;
  if (category && category.type !== ChannelTypes.GUILD_CATEGORY) {
    return warn(context, translate('decoy.in_not_category'));
  }
  // `canEdit`/`can` on a category check its overwrites, the new channel starts with them
  const missing = CREATE_PERMISSIONS.filter((permission) => {
    return !(me && ((category) ? category.can(permission, me) : me.can(permission)));
  });
  if (missing.length) {
    return warn(context, translate('decoy.bot_missing_permissions'));
  }
  const from = args.from || null;
  if (from && from.bot) {
    return warn(context, translate('decoy.from_bot'));
  }
  const existing = await getGuildDecoy(context, guild.id);
  if (existing) {
    return warn(context, translate('decoy.already_exists', {channel: `<#${existing.channel_id}>`}));
  }

  const audit = await getGuildTranslator(context);
  const textChannelNames = guild.channels.filter((channel) => channel.type === ChannelTypes.GUILD_TEXT).map((channel) => channel.name);
  const name = (args.name && args.name.trim()) ? args.name.trim().slice(0, 100) : generateDecoyChannelName(textChannelNames, audit.language);
  const channel = await guild.createChannel({
    name,
    parentId: (category) ? category.id : undefined,
    permissionOverwrites: [
      {allow: String(EVERYONE_ALLOW), deny: String(EVERYONE_DENY), id: guild.id, type: OverwriteTypes.ROLE},
      {allow: String(BOT_ALLOW), deny: '0', id: context.client.userId, type: OverwriteTypes.MEMBER},
    ],
    // the top of the list (or of the category), spam accounts start with the first channels they see
    position: 0,
    reason: audit.translate('decoy.audit_create', {user: formatUserTag(context.user)}),
    type: ChannelTypes.GUILD_TEXT,
  });

  let decoy: RestResponsesRaw.GuildDecoy;
  try {
    const webhook = await channel.createWebhook({name: createDecoyWebhookName(name)});
    const notice = (args.notice === 'me') ? null : await postBotNotice(channel, audit.translate('decoy.notice_default'));
    ({ decoy } = await putGuildDecoy(context, guild.id, {
      channelId: channel.id,
      nameGenerated: !args.name,
      noticeMessageId: (notice) ? notice.id : null,
      noticePendingUserId: (notice) ? null : (from || context.user).id,
      userId: context.userId,
      webhookId: webhook.id,
      webhookToken: webhook.token!,
    }));
  } catch(error) {
    // no channel left behind if the webhook or the api failed
    await channel.delete({reason: audit.translate('decoy.audit_create_failed')}).catch(() => null);
    throw error;
  }
  DecoyStore.apply(decoy, guild.id);

  const settings = await GuildSettingsStore.getOrFetch(context, guild.id);
  const rule = (settings) ? resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.DECOY, null, null) : null;
  const clean = (settings) ? settings.settings.banClean : BAN_CLEAN_DEFAULT;
  const description = [
    translate('decoy.created', {channel: `<#${channel.id}>`}),
    (clean) ? translate('decoy.what_it_does', {duration: formatDuration(clean * 1000, translator.language)}) : translate('decoy.what_it_does_no_clean'),
    translate('decoy.grace_hint', {button: translate('decoy.grace_button_keep'), duration: formatDuration(GRACE_TIME, translator.language)}),
    `-# ${translate('decoy.who_is_skipped')}`,
    '',
  ];
  if (decoy.notice_pending_user_id) {
    description.push(translate((decoy.notice_pending_user_id === context.userId) ? 'decoy.post_it_yourself' : 'decoy.post_it_them', {
      channel: `<#${channel.id}>`,
      user: `<@${decoy.notice_pending_user_id}>`,
    }));
    description.push(...formatSuggestedNotice(translator, audit.language));
  } else {
    description.push(translate('decoy.default_notice_hint'));
  }
  if (!rule) {
    description.push(`-# ${translate('decoy.autowarn_hint')}`);
  }
  return displayReply(context, {
    allowedMentions: {parse: []},
    color: EmbedColors.DEFAULT,
    description: description.join('\n'),
    ephemeral: true,
  });
}


export interface NoticeArgs {
  // the next message from them becomes the notice (them: whoever ran it, without `text`)
  from?: Structures.Member | Structures.User | null,
  // I post this instead (`reset`: the default)
  text?: string,
}

export async function createNoticeMessage(context: Context, args: NoticeArgs) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const guildId = context.guildId!;
  const decoy = await getGuildDecoy(context, guildId);
  if (!decoy) {
    return warn(context, translate('decoy.none'));
  }
  const channel = context.guild!.channels.get(decoy.channel_id);
  if (!channel) {
    return warn(context, translate('decoy.channel_missing'));
  }

  const text = (args.text || '').trim();
  if (text && !args.from) {
    const content = (['reset', 'default'].includes(text.toLowerCase())) ? null : text;
    if (content && NOTICE_MAX_LENGTH < content.length) {
      return warn(context, translate('decoy.notice_too_long', {max: NOTICE_MAX_LENGTH.toLocaleString(translator.language)}));
    }
    // in the server's language, not theirs
    const audit = await getGuildTranslator(context);
    const body = content || audit.translate('decoy.notice_default');
    // my own notice is edited in place, a member's is replaced (it's deleted only once mine is up)
    let messageId: string | null = null;
    if (decoy.notice_message_id && !decoy.notice_user_id) {
      try {
        await context.client.rest.editMessage(channel.id, decoy.notice_message_id, {allowedMentions: {parse: []}, content: body});
        messageId = decoy.notice_message_id;
      } catch(error) {
        // deleted, post a new one
      }
    }
    if (!messageId) {
      messageId = (await postBotNotice(channel, body)).id;
    }
    const old = decoy.notice_message_id;
    await editDecoy(context, guildId, {
      noticeContent: content,
      noticeMessageId: messageId,
      noticePendingUserId: null,
      noticeUserId: null,
    });
    if (old && old !== messageId) {
      await context.client.rest.deleteMessage(channel.id, old).catch(() => null);
    }
    return displayReply(context, {
      description: [
        translate('decoy.notice_set_bot', {channel: `<#${channel.id}>`}),
        `-# ${translate('decoy.bot_notice_hint')}`,
      ].join('\n'),
      ephemeral: true,
    });
  }

  const from = args.from || context.user;
  if (from.bot) {
    return warn(context, translate('decoy.from_bot'));
  }
  await editDecoy(context, guildId, {noticePendingUserId: from.id});
  const audit = await getGuildTranslator(context);
  return displayReply(context, {
    allowedMentions: {parse: []},
    description: [
      translate((from.id === context.userId) ? 'decoy.post_it_yourself' : 'decoy.post_it_them', {
        channel: `<#${channel.id}>`,
        user: `<@${from.id}>`,
      }),
      `-# ${translate('decoy.old_notice_stays')}`,
      ...formatSuggestedNotice(translator, audit.language),
    ].join('\n'),
    ephemeral: true,
  });
}


export interface RenameArgs {
  name?: string,
}

export async function createRenameMessage(context: Context, args: RenameArgs) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const guild = context.guild!;
  const decoy = await getGuildDecoy(context, guild.id);
  if (!decoy) {
    return warn(context, translate('decoy.none'));
  }
  const channel = guild.channels.get(decoy.channel_id);
  if (!channel) {
    return warn(context, translate('decoy.channel_missing'));
  }
  if (!channel.canEdit) {
    return warn(context, translate('decoy.bot_missing_permissions'));
  }
  const now = Date.now();
  const recent = (renames.get(channel.id) || []).filter((at) => now - at < RENAME_WINDOW);
  if (RENAME_LIMIT <= recent.length) {
    return warn(context, translate('decoy.rename_ratelimited', {when: displayTimestamp(recent[0] + RENAME_WINDOW)}));
  }
  // counted before anything awaits, two renames at once both passed the check otherwise (and the second waited out a 429)
  recent.push(now);
  renames.set(channel.id, recent);

  const audit = await getGuildTranslator(context);
  const given = (args.name || '').trim();
  const others = guild.channels.filter((x) => x.type === ChannelTypes.GUILD_TEXT && x.id !== channel.id).map((x) => x.name);
  const name = (given) ? given.slice(0, 100) : generateDecoyChannelName([...others, channel.name], audit.language);
  const edited = await channel.edit({name, reason: audit.translate('decoy.audit_rename', {user: formatUserTag(context.user)})});
  if (decoy.name_generated !== !given) {
    await editDecoy(context, guild.id, {nameGenerated: !given});
  }
  // the bait's name follows the channel's
  if (decoy.webhook_id && decoy.webhook_token) {
    await context.client.rest.editWebhookToken(decoy.webhook_id, decoy.webhook_token, {name: createDecoyWebhookName(edited.name)}).catch(() => null);
  }
  return displayReply(context, {description: translate('decoy.renamed', {channel: `<#${channel.id}>`}), ephemeral: true});
}


export interface SettingsArgs {
  // seconds between bait messages on average
  interval?: number,
  bait?: boolean,
  // seconds of messages deleted, null: the server's ban clean
  clean?: number | null,
  // the channel's topic, empty or `none` clears it
  topic?: string,
}

export function cleanParser(value: string, context: Context): number | null | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (['default', 'server', 'reset'].includes(text)) {
    return null;
  }
  if (['none', 'off', 'never', '0'].includes(text)) {
    return 0;
  }
  return Parameters.secondsWithOptions({float: false})(text, context);
}

export function intervalParser(value: string, context: Context): number | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }
  // a bare number is minutes
  if (/^\d+$/.test(text)) {
    return parseInt(text) * 60;
  }
  return Parameters.secondsWithOptions({float: false})(text, context);
}

export async function createSettingsMessage(context: Context, args: SettingsArgs) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const guild = context.guild!;
  const decoy = await getGuildDecoy(context, guild.id);
  if (!decoy) {
    return warn(context, translate('decoy.none'));
  }
  if (args.clean !== undefined && args.clean !== null && (args.clean < 0 || BAN_CLEAN_MAX < args.clean)) {
    return warn(context, translate('decoy.invalid_clean', {max: formatDuration(BAN_CLEAN_MAX * 1000, language)}));
  }
  if (args.interval !== undefined && (args.interval < BAIT_INTERVAL_MIN || BAIT_INTERVAL_MAX < args.interval)) {
    return warn(context, translate('decoy.invalid_interval', {
      max: formatDuration(BAIT_INTERVAL_MAX * 1000, language),
      min: formatDuration(BAIT_INTERVAL_MIN * 1000, language),
    }));
  }
  if (args.topic !== undefined) {
    const channel = guild.channels.get(decoy.channel_id);
    if (!channel) {
      return warn(context, translate('decoy.channel_missing'));
    }
    if (TOPIC_MAX_LENGTH < args.topic.length) {
      return warn(context, translate('decoy.topic_too_long', {max: TOPIC_MAX_LENGTH.toLocaleString(language)}));
    }
    const topic = (['none', 'clear', 'off', ''].includes(args.topic.trim().toLowerCase())) ? '' : args.topic.trim();
    await channel.edit({topic});
  }
  const fields: RestOptions.GuildDecoyFields = {};
  if (args.bait !== undefined) {
    fields.baitEnabled = args.bait;
  }
  if (args.interval !== undefined) {
    fields.baitInterval = args.interval;
  }
  if (args.clean !== undefined) {
    fields.cleanSeconds = args.clean;
  }
  const updated = (Object.keys(fields).length) ? await editDecoy(context, guild.id, fields) : decoy;
  return createStatusMessage(context, updated);
}


export async function createStatusMessage(context: Context, known?: RestResponsesRaw.GuildDecoy) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const guild = context.guild!;
  // the api's copy, not the store's: a store that missed it would answer "no decoy" while it's there
  const decoy = known || (await fetchGuildDecoy(context, guild.id)).decoy;
  if (!decoy) {
    return displayReply(context, {description: translate('decoy.none'), ephemeral: true});
  }
  // this cluster wasn't watching it (its list of decoys didn't load, or it missed the change), it is from now on
  let rearmed = false;
  if (!DecoyStore.getByChannel(decoy.channel_id)) {
    DecoyStore.apply(decoy, guild.id);
    rearmed = !!DecoyStore.getByChannel(decoy.channel_id);
    if (!DecoyStore.loader.isLoaded) {
      DecoyStore.load(context.client).catch(() => null);
    }
  }
  const settings = await GuildSettingsStore.getOrFetch(context, guild.id);
  const rule = (settings) ? resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.DECOY, null, null) : null;
  const clean = (decoy.clean_seconds !== null) ? decoy.clean_seconds : (settings) ? settings.settings.banClean : 0;

  let notice: string;
  if (decoy.notice_pending_user_id) {
    notice = translate('decoy.notice_waiting', {user: `<@${decoy.notice_pending_user_id}>`});
  } else if (!decoy.notice_message_id) {
    notice = translate('decoy.notice_none');
  } else if (decoy.notice_user_id) {
    notice = translate('decoy.notice_by', {user: `<@${decoy.notice_user_id}>`});
  } else {
    notice = translate('decoy.notice_by_me');
  }

  let bait: string;
  if (!decoy.webhook_id) {
    bait = translate('decoy.bait_broken');
  } else if (!decoy.bait_enabled) {
    bait = translate('decoy.bait_off');
  } else {
    bait = translate('decoy.bait_on', {duration: formatDuration(decoy.bait_interval * 1000, language)});
  }

  const description = [
    translate('decoy.status_channel', {channel: `<#${decoy.channel_id}>`}),
    (rearmed) ? `${StatusEmojis.WARNING} ${translate('decoy.status_rearmed')}` : null,
    `-> ${notice}`,
    // mine is easier to spot than a member's, steer them to their own
    (decoy.notice_message_id && !decoy.notice_user_id) ? `-# ${translate('decoy.bot_notice_hint')}` : null,
    `-> ${bait}`,
    `-> ${(clean) ? translate('decoy.clean', {duration: formatDuration(clean * 1000, language)}) : translate('decoy.clean_none')}${
      (decoy.clean_seconds === null) ? ` ${translate('decoy.clean_server_default')}` : ''
    }`,
    `-> ${(rule) ? translate('decoy.warnings_on', {weight: formatWarningWeight(translator, rule.warnings)}) : translate('decoy.warnings_off')}`,
    // the create reply scrolls away, this is where moderators look it up again
    `-# ${translate('decoy.who_is_skipped')}`,
    displayDetailsLine([
      translate('decoy.caught', {count: decoy.triggered_count.toLocaleString(language)}),
      (decoy.triggered_last) && translate('decoy.last_caught', {when: displayTimestamp(decoy.triggered_last)}),
    ], true),
  ];
  return displayReply(context, {
    allowedMentions: {parse: []},
    color: EmbedColors.DEFAULT,
    description: description.filter((line) => line !== null).join('\n'),
    ephemeral: true,
  });
}


export interface RemoveArgs {
  // the channel goes too, otherwise it stays as a normal channel
  'delete-channel'?: boolean,
}

export async function createRemoveMessage(context: Context, args: RemoveArgs) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const guild = context.guild!;
  const decoy = await getGuildDecoy(context, guild.id);
  if (!decoy) {
    return warn(context, translate('decoy.none'));
  }
  await deleteGuildDecoy(context, guild.id, {channelId: decoy.channel_id});
  DecoyStore.apply(null, guild.id);

  const audit = await getGuildTranslator(context);
  const channel = guild.channels.get(decoy.channel_id);
  if (decoy.webhook_id && decoy.webhook_token) {
    await context.client.rest.deleteWebhookToken(decoy.webhook_id, decoy.webhook_token).catch(() => null);
  }
  if (args['delete-channel'] && channel) {
    if (!channel.canEdit) {
      return warn(context, translate('decoy.removed_channel_kept_no_permission', {channel: `<#${channel.id}>`}));
    }
    await channel.delete({reason: audit.translate('decoy.audit_remove', {user: formatUserTag(context.user)})});
    return displayReply(context, {description: translate('decoy.removed_with_channel'), ephemeral: true});
  }
  return displayReply(context, {
    description: translate('decoy.removed', {channel: (channel) ? `<#${channel.id}>` : Markup.codestring(decoy.channel_id)}),
    ephemeral: true,
  });
}


// `on`/`off` for `bait`
export function baitParser(value: string, context: Context): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (DM_ON_VALUES.includes(text)) {
    return true;
  }
  if (DM_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new UserError(getCachedTranslator(context).translate('decoy.invalid_bait'));
}
