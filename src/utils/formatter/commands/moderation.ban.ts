import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { deleteGuildTimedBans, putGuildTimedBans } from '../../../api';
import { getApiError } from '../../../api/errors';
import { ApiErrorCodes, BAN_CLEAN_MAX, DateMomentLogFormat, EmbedColors, GuildModerationDmFlags, StatusEmojis } from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { DisplayPayload, DisplayReplyOptions, Parameters, createTimestampMomentFromGuild, displayReply, formatDuration, formatUserTag } from '../../../utils';


export interface CommandArgsBefore {
  clean?: number,
  duration?: number,
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  // seconds of their messages to delete, the server's `ban_clean` without it
  clean?: number,
  // seconds until the bot lifts the ban, a permanent ban without it
  duration?: number,
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'moderation.ban';

export const TIMED_BAN_MIN_DURATION = 60;
export const TIMED_BAN_MAX_DURATION = 365 * 24 * 60 * 60;

// most users one command can ban, more refuses the whole command
export const MAX_USERS = 10;

// discord's bulk ban endpoint takes at most this many users per request
export const BULK_BAN_MAX_USERS = 200;

// bans through discord's bulk ban endpoint when the bot can (it also needs manage server), one request per 200 users
// instead of one each, then bans anyone it didn't one by one (already banned users come back as failed there while a
// single ban still goes through, and this gets the actual error for the rest), returns the ones that couldn't be banned
export async function banUsers(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string,
  userIds: Array<string>,
  options: {deleteMessageSeconds: number, reason: string},
): Promise<Array<{error: any, userId: string}>> {
  let remaining = userIds;
  const me = context.me;
  if (1 < userIds.length && me && me.can(Permissions.MANAGE_GUILD)) {
    remaining = [];
    for (let i = 0; i < userIds.length; i += BULK_BAN_MAX_USERS) {
      const chunk = userIds.slice(i, i + BULK_BAN_MAX_USERS);
      try {
        const { bannedUsers } = await context.rest.bulkGuildBan(guildId, {...options, userIds: chunk});
        const banned = new Set<string>(bannedUsers || []);
        remaining.push(...chunk.filter((userId) => !banned.has(userId)));
      } catch(error) {
        // errors with 500000 when none of them could be banned
        remaining.push(...chunk);
      }
    }
  }

  const failed: Array<{error: any, userId: string}> = [];
  // one failure (rate limit, 5xx, missing permissions) shouldn't stop the rest or the summary
  for (let userId of remaining) {
    try {
      await context.rest.createGuildBan(guildId, userId, options);
    } catch(error) {
      failed.push({error, userId});
    }
  }
  return failed;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  // like a modal from the buttons under a warning, to respond through instead of editing the command's reply
  options: DisplayReplyOptions = {},
) {
  const { language, translate } = await getTranslator(context);
  const { payload } = args;
  if (payload.overLimit) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_ban.too_many_users', {max: MAX_USERS.toLocaleString(language)})}`}, options);
  }

  const canEdit: Array<Structures.Member | Structures.User> = [];
  const cannotEdit: Array<Structures.Member | Structures.User> = [];
  const clientCannotEdit: Array<Structures.Member | Structures.User> = [];
  const us: Array<Structures.Member | Structures.User> = [];

  const admin = context.member;
  const me = context.me;
  for (let member of payload.membersOrUsers) {
    if (me && me.id === member.id) {
      us.push(member);
    } else if (admin && admin.id === member.id) {
      us.push(member);
    } else if (member instanceof Structures.Member) {
      if (!me || !me.canEdit(member)) {
        clientCannotEdit.push(member);
      } else if (!admin || !admin.canEdit(member)) {
        cannotEdit.push(member);
      } else {
        canEdit.push(member);
      }
    } else {
      canEdit.push(member);
    }
  }

  let until: Date | null = null;
  if (args.duration !== undefined && args.duration !== null) {
    if (args.duration < TIMED_BAN_MIN_DURATION || TIMED_BAN_MAX_DURATION < args.duration) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_ban.timed_invalid_duration')}`}, options);
    }
    until = new Date(Date.now() + args.duration * 1000);
  }

  const clean = (args.clean === undefined || args.clean === null) ? await GuildSettingsStore.getBanClean(context, context.guildId!) : args.clean;
  const deleteMessageSeconds = Math.max(Math.min(clean, BAN_CLEAN_MAX), 0);

  // built in a given language: the server's for the audit log (the whole server sees it), the member's for their dm
  // the reason goes last since it can be multiple lines (discord caps audit log reasons at 512 characters, so only the
  // end of a long reason gets cut off)
  const createReason = (translator: Translator): string => {
    const description: Array<string> = [];
    description.push(translator.translate('moderation_ban.moderator', {user: formatUserTag(context.user), user2: context.user.id}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translator.translate('moderation_ban.date', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    if (until) {
      description.push(translator.translate('moderation_ban.duration', {
        duration: formatDuration(args.duration! * 1000, translator.language),
        until: createTimestampMomentFromGuild(until.getTime(), context.guildId).format(DateMomentLogFormat),
      }));
    } else {
      description.push(translator.translate('moderation_ban.duration_permanent'));
    }
    if (deleteMessageSeconds) {
      description.push(translator.translate('moderation_ban.message_cleaning', {duration: formatDuration(deleteMessageSeconds * 1000, translator.language)}));
    }
    description.push(translator.translate('moderation_ban.reason', {text: payload.text || translator.translate('moderation.unspecified_reason')}));
    return description.join('\n').slice(0, 512);
  };
  const auditTranslator = await getGuildTranslator(context);
  const reason = createReason(auditTranslator);

  const guild = context.guild;
  const guildId = context.guildId;

  if (guildId && canEdit.length) {
    const userIds = canEdit.map((memberOrUser) => memberOrUser.id);
    if (until) {
      // saved before banning anyone, so going over the timed ban limits stops the whole command instead of half of it
      try {
        await putGuildTimedBans(context, guildId, {moderatorId: context.userId, timestampEnd: until.getTime(), userIds});
      } catch(error) {
        const information = await getApiError(error);
        if (information && information.code === ApiErrorCodes.MAX_TIMED_BANS) {
          const key = (information.scope === 'timeframe_server') ? 'moderation_ban.timed_limit_timeframe' : 'moderation_ban.timed_limit_server';
          return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate(key, {limit: String(information.limit)})}`}, options);
        }
        throw error;
      }
    } else {
      // a ban without a time replaces an earlier timed one, so they don't get unbanned later
      try {
        await deleteGuildTimedBans(context, guildId, {userIds});
      } catch(error) {
        // not worth failing the ban over, the scheduler only unbans people that are still banned anyways
      }
    }
  }

  // dm'd before any of the bans, they can't get it once they don't share a server with the bot anymore
  const dms = new Map<string, Structures.Message>();
  if (guild && canEdit.length && await GuildSettingsStore.canModerationDm(context, guild.id, GuildModerationDmFlags.BAN)) {
    for (let memberOrUser of canEdit) {
      if (memberOrUser instanceof Structures.Member) {
        try {
          // in their language (or the server's), not the moderator's
          const dm = await getTranslatorForUser(context, memberOrUser.id);
          const dmReason = (dm.language === auditTranslator.language) ? reason : createReason(dm);
          const message = await memberOrUser.createMessage([
            dm.translate('moderation_ban.you_have_been_banned_from', {guild: guild.id, name: Markup.escape.all(guild.name)}),
            '',
            dm.translate('moderation_ban.details', {reason: Markup.codeblock(dmReason)}),
          ].join('\n'));
          dms.set(memberOrUser.id, message);
        } catch(error) {
          // maybe log this?
        }
      }
    }
  }

  const failed: Array<{error: any, memberOrUser: Structures.Member | Structures.User}> = [];
  // ban through rest by guild id so an uncached guild still bans (and the summary reflects what actually happened)
  if (guildId) {
    const errors = await banUsers(context, guildId, canEdit.map((memberOrUser) => memberOrUser.id), {deleteMessageSeconds, reason});
    for (let { error, userId } of errors) {
      failed.push({error, memberOrUser: canEdit.find((memberOrUser) => memberOrUser.id === userId)!});
    }
  } else {
    for (let memberOrUser of canEdit) {
      failed.push({error: new Error('Unknown Guild'), memberOrUser});
    }
  }
  for (let { memberOrUser } of failed) {
    canEdit.splice(canEdit.indexOf(memberOrUser), 1);
    // they weren't banned, so the dm saying they were shouldn't stay around
    const message = dms.get(memberOrUser.id);
    if (message) {
      try {
        await message.delete();
      } catch(error) {
        // they still got it, nothing else to do
      }
    }
  }
  // the ones that didn't get banned shouldn't get unbanned later
  if (until && guildId && failed.length) {
    try {
      await deleteGuildTimedBans(context, guildId, {userIds: failed.map(({ memberOrUser }) => memberOrUser.id)});
    } catch(error) {
      // the scheduler's unban would just fail on someone that isn't banned
    }
  }

  const display: DisplayPayload = {fields: []};
  display.color = EmbedColors.DEFAULT;
  {
    const description: Array<string> = [];
    if (canEdit.length) {
      const members = canEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      for (let member of members) {
        description.push(`-> ${member}`);
      }
      if (until) {
        const unix = Math.floor(until.getTime() / 1000);
        description.push('');
        description.push(translate('moderation_ban.banned_until', {timestamp: `<t:${unix}:F> (<t:${unix}:R>)`}));
      }
      if (reason) {
        description.push('');
        description.push(translate('moderation_ban.audit_log_reason', {reason: Markup.codeblock(reason)}));
      }
      description.push('\u200b');
    }
    if (description.length) {
      display.fields!.push({name: translate('moderation_ban.banned'), value: description.join('\n')});
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length || clientCannotEdit.length) {
      if (clientCannotEdit.length) {
        const members = clientCannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push(translate('moderation_ban.couldn_t_ban_due_to_bot_s'));
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push(translate('moderation_ban.couldn_t_ban_due_to_your_role'));
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (failed.length) {
      description.push(translate('moderation_ban.couldn_t_ban_errored'));
      for (let { error, memberOrUser } of failed) {
        description.push(`-> ${memberOrUser.mention} ${Markup.spoiler(`(${memberOrUser})`)} ${Markup.codestring(String((error && error.message) || error).slice(0, 100))}`);
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push(translate('moderation_ban.cannot_ban_yourself_or_myself'));
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      display.fields!.push({name: translate('moderation_ban.unable_to_ban'), value: description.join('\n')});
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    display.fields!.push({name: translate('moderation_ban.not_found'), value: text});
  }

  {
    const banned = canEdit.length;
    const unableToBan = cannotEdit.length + clientCannotEdit.length + us.length + failed.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (banned) {
      description.push((1 < banned) ? translate('moderation_ban.banned_members', {banned: banned.toLocaleString(language)}) : translate('moderation_ban.banned_member', {banned: banned.toLocaleString(language)}));
    }
    if (unableToBan) {
      description.push((1 < unableToBan) ? translate('moderation_ban.unable_to_ban_members', {unableToBan: unableToBan.toLocaleString(language)}) : translate('moderation_ban.unable_to_ban_member', {unableToBan: unableToBan.toLocaleString(language)}));
    }
    if (notFound) {
      description.push((1 < notFound) ? translate('moderation_ban.unable_to_find_members', {notFound: notFound.toLocaleString(language)}) : translate('moderation_ban.unable_to_find_member', {notFound: notFound.toLocaleString(language)}));
    }
    if (description.length) {
      display.footer = description.join(', ');
    }
  }

  return displayReply(context, display, options);
}
