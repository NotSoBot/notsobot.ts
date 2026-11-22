import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import {
  ClientEvents,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageFlags,
  MessageTypes,
  Permissions,
} from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';
import { EventSubscription } from 'detritus-utils';

import { deleteGuildTimedBans, putGuildDecoyTrigger, putGuildTimedBans } from '../api';
import { RestResponsesRaw } from '../api/types';
import { ApiEventsSpewer } from '../apievents';
import {
  BAN_CLEAN_DEFAULT,
  DECOY_GRACE_TIME,
  DECOY_KEPT_REPEAT_TIME,
  DateMomentLogFormat,
  DiscordReactionEmojis,
  GuildModerationDmFlags,
  GuildWarningAutoTriggers,
  StatusEmojis,
} from '../constants';
import { log } from '../log';
import DecoyStore from '../stores/decoys';
import GuildSettingsStore from '../stores/guildsettings';
import {
  Formatter,
  I18n,
  createTimestampMomentFromGuild,
  displayDetailsLine,
  displayTimestamp,
  formatDuration,
  formatUserTag,
} from '../utils';
import { GuildLoggingCustomEvents, GuildLoggingDecoyAction, GuildLoggingDecoyReason } from '../utils/formatter/loggers';

import GuildLoggingListener from './guildlogging';
import { Listener } from './listener';


// one removal per member at a time, a spam account posts in the decoy and everywhere else at once (and the ban cleans
// up the rest of what it sent). It covers their minute to press "I'm not a bot" too
const IN_PROGRESS_EXPIRE = DECOY_GRACE_TIME + 60 * 1000;
// the buttons outlive the reply a little, a click right at the end gets "too late" instead of "interaction failed"
const GRACE_COMPONENTS_PADDING = 5 * 1000;
// a mistake is one person at a time, this many different accounts posting within a minute is a raid: from this one on
// they're removed straight away (a minute's wait each would leave their spam everywhere else up that long)
const RAID_POSTERS = 3;
// a shared reply takes new posters for this long (its buttons' listener has to end sometime), the next one gets a new
// reply and the old one runs out on its own
const GRACE_JOIN_MAX_AGE = 5 * 60 * 1000;
// my own notice is posted again when it's deleted, not more than this often (someone deleting it over and over)
const NOTICE_REPOST_COOLDOWN = 5 * 1000;
// a softban's unban, a second try after a short wait before they're left banned (a blip shouldn't keep them out)
const UNBAN_ATTEMPTS = 2;
const UNBAN_RETRY_DELAY = 3 * 1000;
// message types a member sends themselves, anything else (pins, joins, boosts) is just deleted
const MEMBER_MESSAGE_TYPES: Array<number> = [MessageTypes.DEFAULT, MessageTypes.REPLY];

type DecoyContext = {client: ShardClient, guild: Structures.Guild, guildId: string, me: Structures.Member | null, rest: ShardClient['rest']};


// expired: they didn't press it, unavailable: no reply to press it on (I can't post there), raid: no minute for them,
// repeat: they pressed it a moment ago and posted again, elsewhere: they posted in another channel during their minute
type GraceResult = {kind: 'expired' | 'kept' | 'repeat' | 'unavailable'} | {kind: 'raid', posters: number} | {kind: 'elsewhere', channelId: string};
// how one poster's minute ended, `elsewhere` is the channel they posted in (a person reads the reply first, a spam
// account carries on posting everywhere)
type GraceOutcome = {kind: 'expired' | 'kept'} | {kind: 'elsewhere', channelId: string};


/**
 * One reply in the decoy for everyone waiting at the same time, so five posters don't get five replies (and five
 * posts against the channel's rate limit). Each poster has their own minute, from when they're added: the time shown
 * and the timer are set together, so it never shows less than they really have. Edits add and drop posters, mentions
 * added by an edit don't ping but they've just posted there.
 */
class GracePrompt {
  closed = false;
  created = Date.now();
  // user id -> their deadline
  entries = new Map<string, {deadline: number, resolve: (outcome: GraceOutcome) => void, timeout: ReturnType<typeof setTimeout>}>();
  // whose minute is over and how it ended, a late press gets "too late" (or "staying" again) instead of "only for"
  finished = new Map<string, GraceOutcome['kind']>();
  message: Promise<Structures.Message | null> | null = null;
  // edits and the delete one after another, an older content never lands last
  updating: Promise<unknown> = Promise.resolve();

  constructor(
    public context: DecoyContext,
    public channelId: string,
    // the first poster's message, the reply points at it
    public replyToId: string,
    // the server's language, it's for everyone in the channel (Help is in whoever presses it's own)
    public translator: I18n.Translator,
    public onClose: (prompt: GracePrompt) => void,
  ) {}

  add(userId: string): Promise<GraceOutcome> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => this.finish(userId, {kind: 'expired'}), DECOY_GRACE_TIME);
      this.entries.set(userId, {deadline: Date.now() + DECOY_GRACE_TIME, resolve, timeout});
      if (this.message) {
        this.render();
      } else {
        this.message = this.post();
      }
    });
  }

  // their wait ends (pressed, ran out or posted elsewhere), the last one out deletes the reply
  finish(userId: string, outcome: GraceOutcome): void {
    const entry = this.entries.get(userId);
    if (!entry) {
      return;
    }
    clearTimeout(entry.timeout);
    this.entries.delete(userId);
    this.finished.set(userId, outcome.kind);
    entry.resolve(outcome);
    if (this.entries.size) {
      this.render();
    } else {
      this.close();
    }
  }

  close(): void {
    this.closed = true;
    this.onClose(this);
    this.updating = this.updating.then(async () => {
      const message = await this.message;
      if (message) {
        // deleting it drops the buttons' listener too
        await message.delete().catch(() => null);
      }
    });
  }

  mentions(): string {
    return Array.from(this.entries.keys()).map((userId) => `<@${userId}>`).join(' ');
  }

  content(): string {
    const { translate } = this.translator;
    const prompt = translate('decoy.grace_prompt', {button: translate('decoy.grace_button_keep'), user: this.mentions()});
    const deadlines = Array.from(this.entries).map(([userId, entry]) => `<@${userId}> ${displayTimestamp(entry.deadline)}`);
    return `${StatusEmojis.WARNING} ${prompt}\n${displayDetailsLine(deadlines, true)}`;
  }

  render(): void {
    this.updating = this.updating.then(async () => {
      const message = await this.message;
      if (message && !this.closed) {
        await message.edit({allowedMentions: {parse: [], users: Array.from(this.entries.keys())}, content: this.content()}).catch(() => null);
      }
    });
  }

  async post(): Promise<Structures.Message | null> {
    const { translate } = this.translator;
    const components = new Components({timeout: GRACE_JOIN_MAX_AGE + DECOY_GRACE_TIME + GRACE_COMPONENTS_PADDING});
    components.createButton({
      label: translate('decoy.grace_button_keep'),
      style: MessageComponentButtonStyles.SUCCESS,
      run: (ctx: ComponentContext) => this.onKeep(ctx),
    });
    components.createButton({
      label: translate('decoy.grace_button_help'),
      style: MessageComponentButtonStyles.SECONDARY,
      run: (ctx: ComponentContext) => this.onHelp(ctx),
    });
    try {
      return await this.context.rest.createMessage(this.channelId, {
        allowedMentions: {parse: [], repliedUser: true, users: Array.from(this.entries.keys())},
        components,
        content: this.content(),
        messageReference: {channelId: this.channelId, failIfNotExists: false, guildId: this.context.guildId, messageId: this.replyToId},
      });
    } catch(error) {
      // nothing to press it on, everyone waiting is removed like before
      for (let userId of Array.from(this.entries.keys())) {
        this.finish(userId, {kind: 'expired'});
      }
      return null;
    }
  }

  async onKeep(ctx: ComponentContext): Promise<void> {
    // their own language, they pressed it themselves
    const { language, translate } = await I18n.getTranslator(ctx);
    const finished = this.finished.get(ctx.userId);
    if (this.entries.has(ctx.userId) || finished === 'kept') {
      // claimed before anything is awaited, their timer can't remove them after this
      this.finish(ctx.userId, {kind: 'kept'});
      await respondEphemeral(ctx, [
        `${StatusEmojis.YES} ${translate('decoy.grace_kept')}`,
        translate('decoy.grace_kept_repeat', {duration: formatDuration(DECOY_KEPT_REPEAT_TIME, language)}),
      ].join('\n'));
    } else if (finished) {
      // removed for posting in another channel, their minute hadn't run out
      const key = (finished === 'elsewhere') ? 'decoy.grace_too_late_elsewhere' : 'decoy.grace_too_late';
      await respondEphemeral(ctx, `${StatusEmojis.WARNING} ${translate(key)}`);
    } else {
      await respondEphemeral(ctx, `${StatusEmojis.WARNING} ${translate('decoy.grace_not_yours', {user: this.mentions()})}`);
    }
  }

  // the default notice: a moderator's own notice can be in any language, this one is in theirs
  async onHelp(ctx: ComponentContext): Promise<void> {
    const { translate } = await I18n.getTranslator(ctx);
    const entry = this.entries.get(ctx.userId);
    await respondEphemeral(ctx, [
      translate('decoy.notice_default'),
      (entry) && '',
      (entry) && translate('decoy.grace_help', {button: translate('decoy.grace_button_keep'), when: displayTimestamp(entry.deadline)}),
    ].filter((line) => typeof(line) === 'string').join('\n'));
  }
}

function respondEphemeral(ctx: ComponentContext, content: string) {
  return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
    allowedMentions: {parse: []},
    content,
    flags: MessageFlags.EPHEMERAL,
  });
}


class DecoyListener extends Listener {
  // `guild id.user id` -> the rest of what they posted meanwhile (in the decoy, or the post elsewhere that ended their
  // minute), deleted with the first one
  inProgress = new Collections.BaseCollection<string, Array<{channelId: string, messageId: string}>>({expire: IN_PROGRESS_EXPIRE});
  // guild id -> when my notice was last posted again
  reposted = new Collections.BaseCollection<string, number>({expire: NOTICE_REPOST_COOLDOWN});
  // guild id -> the check once the cooldown's over, for a notice deleted again during it (it was dropped, the channel
  // stayed without a notice while members posting there got softbanned)
  repostChecks = new Map<string, ReturnType<typeof setTimeout>>();
  // decoy channel id -> the reply new posters join
  prompts = new Map<string, GracePrompt>();
  // `guild id.user id` -> when they pressed "I'm not a bot", see `DECOY_KEPT_REPEAT_TIME`. in memory: a server's
  // messages always reach this cluster, a restart forgets it like it forgets the minute
  kept = new Collections.BaseCollection<string, number>({expire: DECOY_KEPT_REPEAT_TIME});
  // decoy channel id -> user id -> when they last posted there, for the raid count
  posters = new Map<string, Map<string, number>>();
  // `guild id.user id` -> the reply they're in their minute on, a post in any other channel ends it
  waiting = new Map<string, GracePrompt>();

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    subscriptions.push(cluster.subscribe(ClientEvents.MESSAGE_CREATE, ({ message, shard }) => {
      if (!message.guildId) {
        return;
      }
      const check = () => {
        const decoy = DecoyStore.getByChannel(message.channelId);
        if (decoy) {
          this.onMessage(shard, decoy, message).catch((error) => {
            log.error(`Decoy failed for ${message.guildId}`, error);
          });
        } else if (this.waiting.size) {
          this.onMessageElsewhere(message);
        }
      };
      if (DecoyStore.loader.isLoaded) {
        check();
      } else {
        // waits for the load that's going (or starts one) instead of missing this post. A load that failed recently
        // answers straight away, with the decoys commands and events put in meanwhile
        DecoyStore.load(shard).catch(() => false).then(check);
      }
    }));

    subscriptions.push(cluster.subscribe(ClientEvents.MESSAGE_DELETE, ({ channelId, messageId, shard }) => {
      const decoy = DecoyStore.getByChannel(channelId);
      if (decoy && decoy.notice_message_id === messageId) {
        this.onNoticeDelete(shard, decoy).catch((error) => log.error(`Decoy notice repost failed for ${decoy.guild_id}`, error));
      }
    }));

    subscriptions.push(cluster.subscribe(ClientEvents.MESSAGE_DELETE_BULK, ({ channelId, raw, shard }) => {
      const decoy = DecoyStore.getByChannel(channelId);
      if (decoy && decoy.notice_message_id && raw.ids.includes(decoy.notice_message_id)) {
        this.onNoticeDelete(shard, decoy).catch((error) => log.error(`Decoy notice repost failed for ${decoy.guild_id}`, error));
      }
    }));

    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    for (let timeout of this.repostChecks.values()) {
      clearTimeout(timeout);
    }
    this.repostChecks.clear();
  }

  async deleteMessage(message: Structures.Message): Promise<void> {
    if (message.canDelete) {
      await message.delete().catch(() => null);
    }
  }

  async onMessage(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy, message: Structures.Message): Promise<void> {
    if (message.id === decoy.notice_message_id || message.author.id === shard.userId) {
      return;
    }
    // our own bait deletes itself, anything another webhook or integration posts just goes
    if (message.webhookId) {
      if (message.webhookId !== decoy.webhook_id) {
        await this.deleteMessage(message);
      }
      return;
    }

    // the member we're waiting on posted the notice, checked first: running `create` doesn't need Manage Messages, they'd
    // be removed otherwise
    if (decoy.notice_pending_user_id === message.author.id && MEMBER_MESSAGE_TYPES.includes(message.type)) {
      await this.adoptNotice(shard, decoy, message);
      return;
    }

    if (message.fromSystem || !MEMBER_MESSAGE_TYPES.includes(message.type) || message.author.bot) {
      await this.deleteMessage(message);
      return;
    }

    const guild = message.guild || shard.guilds.get(decoy.guild_id);
    if (!guild) {
      return;
    }
    const context: DecoyContext = {client: shard, guild, guildId: guild.id, me: guild.me, rest: shard.rest};
    const settings = await GuildSettingsStore.getOrFetch(context, guild.id);
    const member = message.member || guild.members.get(message.author.id) || null;

    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const rule = (settings) ? AutoWarn.resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.DECOY, null, null) : null;
    const exempt = (member) ? this.getExemptReason(member, settings, rule) : null;
    if (exempt) {
      await this.deleteMessage(message);
      // logged so a deleted post with no removal isn't a mystery to the moderators
      this.log(context, decoy, {
        action: 'exempt',
        attachments: message.attachments.size,
        clean: 0,
        content: message.content || '',
        elsewhere: null,
        raid: 0,
        reason: exempt,
        repeat: false,
        user: message.author,
        warned: false,
      });
      return;
    }

    const key = `${guild.id}.${message.author.id}`;
    const others = this.inProgress.get(key);
    if (others) {
      // their removal (or their minute to press the button) is already going, this one goes with the first
      others.push({channelId: message.channelId, messageId: message.id});
      return;
    }
    // `inProgress` only expires as a safety net, so a removal that outlives it keeps its own list (and doesn't drop a
    // newer removal's entry when it ends)
    const pending: Array<{channelId: string, messageId: string}> = [];
    this.inProgress.set(key, pending);
    try {
      await this.removeMember(context, decoy, message, member, settings, rule, key, pending);
    } finally {
      if (this.inProgress.get(key) === pending) {
        this.inProgress.delete(key);
      }
    }
  }

  // they posted somewhere else while their minute to press "I'm not a bot" was running: no person does that with the
  // reply right there, so it's over and they're removed now (the post goes with the rest of their messages)
  onMessageElsewhere(message: Structures.Message): void {
    if (message.webhookId || !MEMBER_MESSAGE_TYPES.includes(message.type)) {
      return;
    }
    const key = `${message.guildId}.${message.author.id}`;
    const prompt = this.waiting.get(key);
    if (!prompt) {
      return;
    }
    const others = this.inProgress.get(key);
    if (others) {
      others.push({channelId: message.channelId, messageId: message.id});
    }
    prompt.finish(message.author.id, {kind: 'elsewhere', channelId: message.channelId});
  }

  // why the decoy skips them, null: it doesn't
  getExemptReason(
    member: Structures.Member,
    settings: Awaited<ReturnType<typeof GuildSettingsStore.getOrFetch>>,
    rule: RestResponsesRaw.GuildWarningAuto | null,
  ): GuildLoggingDecoyReason | null {
    // the owner, admins and moderators who can delete messages anyway (testing it, or by mistake)
    if (member.isOwner) {
      return 'owner';
    }
    if (member.canAdministrator) {
      return 'administrator';
    }
    if ((member.permissions & Permissions.MANAGE_MESSAGES) === Permissions.MANAGE_MESSAGES) {
      return 'manage_messages';
    }
    if (!settings) {
      return null;
    }
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    // the server's auto-warn exemption and the decoy rule's own skip the removal too, not only the warning
    if (
      AutoWarn.matchesGuildWarningAutoExempt(member, settings.settings.warningsAutoExempt) ||
      (!!rule && AutoWarn.matchesGuildWarningAutoExempt(member, rule.exempt))
    ) {
      return 'autowarn_exempt';
    }
    return null;
  }

  async removeMember(
    context: DecoyContext,
    decoy: RestResponsesRaw.GuildDecoy,
    message: Structures.Message,
    member: Structures.Member | null,
    settings: Awaited<ReturnType<typeof GuildSettingsStore.getOrFetch>>,
    rule: RestResponsesRaw.GuildWarningAuto | null,
    key: string,
    pending: Array<{channelId: string, messageId: string}>,
  ): Promise<void> {
    const { guild, me } = context;
    const user = message.author;
    // what they posted, kept for the log before the ban deletes it
    const content = message.content || '';
    const attachments = message.attachments.size;
    const clean = (decoy.clean_seconds !== null) ? decoy.clean_seconds : (settings) ? settings.settings.banClean : BAN_CLEAN_DEFAULT;
    const channelName = (message.channel) ? message.channel.name : decoy.channel_id;

    let cannotBan: GuildLoggingDecoyReason | null = null;
    if (!me || !me.can(Permissions.BAN_MEMBERS)) {
      cannotBan = 'missing_permission';
    } else if (member && !me.canEdit(member)) {
      cannotBan = 'role_hierarchy';
    }
    if (cannotBan) {
      await this.deleteMessage(message);
      this.log(context, decoy, {action: 'none', attachments, clean: 0, content, elsewhere: null, raid: 0, reason: cannotBan, repeat: false, user, warned: false});
      return;
    }

    // a minute to press "I'm not a bot", only asked when there's a removal to get out of
    const grace = await this.waitForPerson(context, message);
    if (grace.kind === 'kept') {
      await this.deleteMessage(message);
      await this.deletePending(context, pending);
      this.kept.set(key, Date.now());
      this.log(context, decoy, {action: 'kept', attachments, clean: 0, content, elsewhere: null, raid: 0, reason: null, repeat: false, user, warned: false});
      return;
    }
    const raid = (grace.kind === 'raid') ? grace.posters : 0;
    const repeat = grace.kind === 'repeat';
    const elsewhere = (grace.kind === 'elsewhere') ? grace.channelId : null;

    const audit = await I18n.getGuildTranslator(context as unknown as I18n.LanguageContext);
    const languageContext = context as unknown as I18n.LanguageContext;
    const dmNote = await this.createRemovalNote(languageContext, user.id, guild, clean);

    // the warning (and its dm) before the ban, they can't get a dm from a server they're not in
    let step: RestResponsesRaw.GuildWarningAction | null = null;
    let warned = false;
    let dmSent = false;
    if (rule && member && settings) {
      const reason = Formatter.Commands.ModerationAutowarn.createAutoWarnReason(audit, rule, {decoyChannelName: channelName});
      const result = await Formatter.Commands.ModerationAutowarn.runAutoWarn(context, {
        cooldownKey: decoy.channel_id,
        dmNote,
        member,
        messageId: message.id,
        reason,
        rule,
        runStep: false,
        settings,
      });
      if (result) {
        step = result.step;
        warned = true;
        dmSent = result.dmSent;
      }
    }
    const dmDisabled = (settings) ? (settings.settings.moderationDmDisabled & GuildModerationDmFlags.DECOY) === GuildModerationDmFlags.DECOY : false;
    if (!dmSent && !dmDisabled) {
      try {
        const dm = await I18n.getTranslatorForUser(languageContext, user.id);
        await user.createMessage([
          dm.translate('decoy.dm_removed', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          dmNote,
        ].join('\n'));
      } catch(error) {
        // dms closed
      }
    }

    const formatTime = (timestamp: number) => createTimestampMomentFromGuild(timestamp, guild.id).format(DateMomentLogFormat);
    const auditReason = [
      audit.translate('moderation_ban.moderator', {user: formatUserTag(me!.user), user2: me!.id}),
      audit.translate('moderation_ban.date', {timestamp: formatTime(Date.now())}),
      (clean) && audit.translate('moderation_ban.message_cleaning', {duration: formatDuration(clean * 1000, audit.language)}),
      audit.translate('moderation_ban.reason', {text: audit.translate('decoy.audit_reason', {channel: `#${channelName}`})}),
    ].filter(Boolean).join('\n').slice(0, 512);

    let action: GuildLoggingDecoyAction = 'softban';
    try {
      if (step && step.action === 'ban') {
        // their warnings reached a ban, it stays
        action = 'ban';
        if (step.duration) {
          await putGuildTimedBans(context, guild.id, {
            moderatorId: me!.id,
            timestampEnd: Date.now() + step.duration * 1000,
            userIds: [user.id],
          });
        } else {
          await deleteGuildTimedBans(context, guild.id, {userIds: [user.id]}).catch(() => null);
        }
        await context.rest.createGuildBan(guild.id, user.id, {deleteMessageSeconds: clean, reason: auditReason});
      } else {
        // a softban: banned for their messages to go, then let back in
        await context.rest.createGuildBan(guild.id, user.id, {deleteMessageSeconds: clean, reason: auditReason});
      }
    } catch(error) {
      // the permission and role checks passed, so this one is Discord's answer (or a cache that was out of date)
      log.warn(`Decoy ban failed for ${user.id} in ${guild.id} (${decoy.channel_id})`, error);
      action = 'none';
    }
    // the ban went through, a failed unban leaves them banned: tried twice, then logged as a ban that stuck
    let reason: GuildLoggingDecoyReason | null = (action === 'none') ? 'ban_failed' : null;
    if (action === 'softban' && !(await this.unban(context, user.id, auditReason))) {
      log.warn(`Decoy unban failed for ${user.id} in ${guild.id} (${decoy.channel_id}), they stay banned`);
      action = 'ban';
      reason = 'unban_failed';
    }
    // nothing cleaned (or it failed), their messages still go
    if (!clean || action === 'none') {
      await this.deleteMessage(message);
      await this.deletePending(context, pending);
    }

    putGuildDecoyTrigger(context, guild.id, decoy.channel_id).catch(() => null);
    this.log(context, decoy, {
      action,
      attachments,
      clean: (action === 'none') ? 0 : clean,
      content,
      elsewhere,
      raid,
      reason,
      repeat,
      user,
      warned,
    });
  }

  async unban(context: DecoyContext, userId: string, reason: string): Promise<boolean> {
    for (let attempt = 0; attempt < UNBAN_ATTEMPTS; attempt++) {
      if (attempt) {
        await new Promise((resolve) => setTimeout(resolve, UNBAN_RETRY_DELAY));
      }
      try {
        await context.rest.removeGuildBan(context.guildId, userId, {reason});
        return true;
      } catch(error) {
        log.warn(`Decoy unban attempt ${attempt + 1} failed for ${userId} in ${context.guildId}`, error);
      }
    }
    return false;
  }

  async deletePending(context: DecoyContext, pending: Array<{channelId: string, messageId: string}>): Promise<void> {
    for (let { channelId, messageId } of pending) {
      await context.rest.deleteMessage(channelId, messageId).catch(() => null);
    }
  }

  // how many different accounts posted in the decoy within the last minute, them included
  countPosters(channelId: string, userId: string): number {
    const now = Date.now();
    let recent = this.posters.get(channelId);
    if (!recent) {
      recent = new Map();
      this.posters.set(channelId, recent);
    }
    for (let [id, at] of recent) {
      if (DECOY_GRACE_TIME <= now - at) {
        recent.delete(id);
      }
    }
    recent.set(userId, now);
    return recent.size;
  }

  /**
   * Reacts to their post and adds them to the decoy's reply with "I'm not a bot" (only for whoever's waiting) and Help
   * (anyone, the notice again in their own language). A restart in the middle drops it, the bait's start-up sweep
   * deletes the messages and they stay.
   */
  async waitForPerson(context: DecoyContext, message: Structures.Message): Promise<GraceResult> {
    // still one of the posters for the raid count
    if (this.kept.has(`${context.guildId}.${message.author.id}`)) {
      this.countPosters(message.channelId, message.author.id);
      return {kind: 'repeat'};
    }
    const channel = message.channel;
    if (!channel || !channel.canMessage) {
      return {kind: 'unavailable'};
    }
    const posters = this.countPosters(channel.id, message.author.id);
    if (RAID_POSTERS <= posters) {
      return {kind: 'raid', posters};
    }
    const translator = await I18n.getGuildTranslator(context as unknown as I18n.LanguageContext);
    const { WARNING } = DiscordReactionEmojis;
    message.react(`${WARNING.name}:${WARNING.id}`).catch(() => null);

    // nothing awaited from here to `add`, two posters at once can't both make a reply
    let prompt = this.prompts.get(channel.id);
    if (!prompt || prompt.closed || GRACE_JOIN_MAX_AGE <= Date.now() - prompt.created) {
      prompt = new GracePrompt(context, channel.id, message.id, translator, (closed) => {
        if (this.prompts.get(channel.id) === closed) {
          this.prompts.delete(channel.id);
        }
      });
      this.prompts.set(channel.id, prompt);
    }
    const key = `${context.guildId}.${message.author.id}`;
    this.waiting.set(key, prompt);
    try {
      return await prompt.add(message.author.id);
    } finally {
      if (this.waiting.get(key) === prompt) {
        this.waiting.delete(key);
      }
    }
  }

  // "You were removed from **Server**... you can rejoin", the line under the warning dm, or the whole dm without one
  async createRemovalNote(context: I18n.LanguageContext, userId: string, guild: Structures.Guild, clean: number): Promise<string> {
    const dm = await I18n.getTranslatorForUser(context, userId);
    return (clean) ? dm.translate('decoy.dm_note', {
      duration: formatDuration(clean * 1000, dm.language),
      name: Markup.escape.all(guild.name),
    }) : dm.translate('decoy.dm_note_no_clean', {name: Markup.escape.all(guild.name)});
  }

  log(
    context: DecoyContext,
    decoy: RestResponsesRaw.GuildDecoy,
    payload: {
      action: GuildLoggingDecoyAction,
      attachments: number,
      clean: number,
      content: string,
      elsewhere: string | null,
      raid: number,
      reason: GuildLoggingDecoyReason | null,
      repeat: boolean,
      user: Structures.User,
      warned: boolean,
    },
  ): void {
    GuildLoggingListener.logModeration(context.client, {
      guildId: context.guildId,
      happened: Date.now(),
      name: GuildLoggingCustomEvents.DECOY_CATCH,
      payload: {...payload, channelId: decoy.channel_id},
    });
  }

  // their message is the notice now, the old one goes (only now, so the channel is never empty). The api only hands it
  // over while they're still the one waited on and says which notice it replaced: a second post before its update
  // reached us (both used to be adopted, the second deleting the original instead of the first post), or a moderator
  // putting the bot's notice back meanwhile, isn't adopted. That post just goes, they're no spammer
  async adoptNotice(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy, message: Structures.Message): Promise<void> {
    let result: RestResponsesRaw.AdoptGuildDecoyNotice;
    try {
      result = await Formatter.Commands.ServerDecoy.adoptNotice({client: shard}, decoy.guild_id, message.author.id, message.id);
    } catch(error) {
      // an api from before the adopt route: as before, from our copy
      log.warn(`Decoy notice adopt failed for ${decoy.guild_id}, saving it directly`, error);
      const old = decoy.notice_message_id;
      await Formatter.Commands.ServerDecoy.editDecoy({client: shard}, decoy.guild_id, {
        noticeContent: null,
        noticeMessageId: message.id,
        noticePendingUserId: null,
        noticeUserId: message.author.id,
      });
      if (old && old !== message.id) {
        await shard.rest.deleteMessage(decoy.channel_id, old).catch(() => null);
      }
      return;
    }
    if (!result.adopted) {
      if (result.decoy.notice_message_id !== message.id) {
        await this.deleteMessage(message);
      }
      return;
    }
    if (result.previous_message_id) {
      await shard.rest.deleteMessage(decoy.channel_id, result.previous_message_id).catch(() => null);
    }
  }

  // mine goes back up, a member's waits for them to post it again (I can't post as them)
  async onNoticeDelete(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy): Promise<void> {
    const guild = shard.guilds.get(decoy.guild_id);
    const channel = shard.channels.get(decoy.channel_id);
    if (!guild || !channel) {
      return;
    }
    if (decoy.notice_user_id) {
      const userId = decoy.notice_user_id;
      await Formatter.Commands.ServerDecoy.editDecoy({client: shard}, decoy.guild_id, {
        noticeMessageId: null,
        // someone else they were going to hand it to keeps their turn
        noticePendingUserId: decoy.notice_pending_user_id || userId,
        noticeUserId: null,
      });
      GuildLoggingListener.logModeration(shard, {
        guildId: decoy.guild_id,
        happened: Date.now(),
        name: GuildLoggingCustomEvents.DECOY_NOTICE_DELETE,
        payload: {channelId: decoy.channel_id, user: shard.users.get(userId) || null, userId},
      });
      return;
    }
    if (this.reposted.has(decoy.guild_id)) {
      const guildId = decoy.guild_id;
      const deletedId = decoy.notice_message_id;
      if (!this.repostChecks.has(guildId)) {
        this.repostChecks.set(guildId, setTimeout(() => {
          this.repostChecks.delete(guildId);
          // still pointing at the deleted one (nobody posted a new notice meanwhile)
          const current = DecoyStore.get(guildId);
          if (current && deletedId && current.notice_message_id === deletedId) {
            this.onNoticeDelete(shard, current).catch((error) => log.error(`Decoy notice repost failed for ${guildId}`, error));
          }
        }, NOTICE_REPOST_COOLDOWN));
      }
      return;
    }
    if (!channel.canMessage) {
      return;
    }
    this.reposted.set(decoy.guild_id, Date.now());
    const context = {client: shard, guild, guildId: guild.id, me: guild.me, rest: shard.rest};
    const audit = await I18n.getGuildTranslator(context as unknown as I18n.LanguageContext);
    const notice = await Formatter.Commands.ServerDecoy.postBotNotice(channel, Formatter.Commands.ServerDecoy.getBotNoticeContent(audit, decoy));
    await Formatter.Commands.ServerDecoy.editDecoy({client: shard}, decoy.guild_id, {noticeMessageId: notice.id});
  }
}

export default new DecoyListener();
