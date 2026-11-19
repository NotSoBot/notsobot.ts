import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import { ClientEvents, MessageTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { EventSubscription } from 'detritus-utils';

import { deleteGuildTimedBans, putGuildDecoyTrigger, putGuildTimedBans } from '../api';
import { RestResponsesRaw } from '../api/types';
import { ApiEventsSpewer } from '../apievents';
import { BAN_CLEAN_DEFAULT, DateMomentLogFormat, GuildModerationDmFlags, GuildWarningAutoTriggers } from '../constants';
import { log } from '../log';
import DecoyStore from '../stores/decoys';
import GuildSettingsStore from '../stores/guildsettings';
import { Formatter, I18n, createTimestampMomentFromGuild, formatDuration, formatUserTag } from '../utils';
import { GuildLoggingCustomEvents } from '../utils/formatter/loggers';

import GuildLoggingListener from './guildlogging';
import { Listener } from './listener';


// one removal per member at a time, a spam account posts in the decoy and everywhere else at once (and the ban cleans
// up the rest of what it sent)
const IN_PROGRESS_EXPIRE = 60 * 1000;
// my own notice is posted again when it's deleted, not more than this often (someone deleting it over and over)
const NOTICE_REPOST_COOLDOWN = 5 * 1000;
// message types a member sends themselves, anything else (pins, joins, boosts) is just deleted
const MEMBER_MESSAGE_TYPES: Array<number> = [MessageTypes.DEFAULT, MessageTypes.REPLY];

type DecoyContext = {client: ShardClient, guild: Structures.Guild, guildId: string, me: Structures.Member | null, rest: ShardClient['rest']};


class DecoyListener extends Listener {
  // `guild id.user id`
  inProgress = new Collections.BaseCollection<string, true>({expire: IN_PROGRESS_EXPIRE});
  // guild id -> when my notice was last posted again
  reposted = new Collections.BaseCollection<string, number>({expire: NOTICE_REPOST_COOLDOWN});

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    subscriptions.push(cluster.subscribe(ClientEvents.MESSAGE_CREATE, ({ message, shard }) => {
      if (!message.guildId) {
        return;
      }
      if (!DecoyStore.loader.isLoaded) {
        DecoyStore.load(shard).catch(() => null);
      }
      const decoy = DecoyStore.getByChannel(message.channelId);
      if (decoy) {
        this.onMessage(shard, decoy, message).catch((error) => {
          log.error(`Decoy failed for ${message.guildId}`, error);
        });
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
    if (member && this.isExempt(member, settings, rule)) {
      await this.deleteMessage(message);
      return;
    }

    const key = `${guild.id}.${message.author.id}`;
    if (this.inProgress.has(key)) {
      // their removal is already going, its ban deletes this one too
      return;
    }
    this.inProgress.set(key, true);
    try {
      await this.removeMember(context, decoy, message, member, settings, rule);
    } finally {
      this.inProgress.delete(key);
    }
  }

  isExempt(
    member: Structures.Member,
    settings: Awaited<ReturnType<typeof GuildSettingsStore.getOrFetch>>,
    rule: RestResponsesRaw.GuildWarningAuto | null,
  ): boolean {
    // the owner, admins and moderators who can delete messages anyway (testing it, or by mistake)
    if (member.isOwner || member.canAdministrator || (member.permissions & Permissions.MANAGE_MESSAGES) === Permissions.MANAGE_MESSAGES) {
      return true;
    }
    if (!settings) {
      return false;
    }
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    // the server's auto-warn exemption and the decoy rule's own skip the removal too, not only the warning
    return AutoWarn.matchesGuildWarningAutoExempt(member, settings.settings.warningsAutoExempt) ||
      (!!rule && AutoWarn.matchesGuildWarningAutoExempt(member, rule.exempt));
  }

  async removeMember(
    context: DecoyContext,
    decoy: RestResponsesRaw.GuildDecoy,
    message: Structures.Message,
    member: Structures.Member | null,
    settings: Awaited<ReturnType<typeof GuildSettingsStore.getOrFetch>>,
    rule: RestResponsesRaw.GuildWarningAuto | null,
  ): Promise<void> {
    const { guild, me } = context;
    const user = message.author;
    // what they posted, kept for the log before the ban deletes it
    const content = message.content || '';
    const attachments = message.attachments.size;
    const clean = (decoy.clean_seconds !== null) ? decoy.clean_seconds : (settings) ? settings.settings.banClean : BAN_CLEAN_DEFAULT;
    const channelName = (message.channel) ? message.channel.name : decoy.channel_id;

    const canBan = !!me && me.can(Permissions.BAN_MEMBERS) && (!member || me.canEdit(member));
    if (!canBan) {
      await this.deleteMessage(message);
      this.log(context, decoy, {action: 'none', attachments, clean: 0, content, user, warned: false});
      return;
    }

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

    let action: 'ban' | 'none' | 'softban' = 'softban';
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
        await context.rest.removeGuildBan(guild.id, user.id, {reason: auditReason});
      }
    } catch(error) {
      action = 'none';
    }
    // nothing cleaned (or it failed), their message still goes
    if (!clean || action === 'none') {
      await this.deleteMessage(message);
    }

    putGuildDecoyTrigger(context, guild.id, decoy.channel_id).catch(() => null);
    this.log(context, decoy, {action, attachments, clean: (action === 'none') ? 0 : clean, content, user, warned});
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
    payload: {action: 'ban' | 'none' | 'softban', attachments: number, clean: number, content: string, user: Structures.User, warned: boolean},
  ): void {
    GuildLoggingListener.logModeration(context.client, {
      guildId: context.guildId,
      happened: Date.now(),
      name: GuildLoggingCustomEvents.DECOY_CATCH,
      payload: {...payload, channelId: decoy.channel_id},
    });
  }

  // their message is the notice now, the old one goes (only now, so the channel is never empty)
  async adoptNotice(shard: ShardClient, decoy: RestResponsesRaw.GuildDecoy, message: Structures.Message): Promise<void> {
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
    if (this.reposted.has(decoy.guild_id) || !channel.canMessage) {
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
