import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildTimedBans, putGuildTimedBans } from '../../../api';
import { getApiError } from '../../../api/errors';
import { ApiErrorCodes, DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply, formatTime, formatUserTag } from '../../../utils';


export interface CommandArgsBefore {
  clean: number,
  duration?: number,
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  clean: number,
  // seconds until the bot lifts the ban, a permanent ban without it
  duration?: number,
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'moderation.ban';

export const TIMED_BAN_MIN_DURATION = 60;
export const TIMED_BAN_MAX_DURATION = 365 * 24 * 60 * 60;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const { payload } = args;

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
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_ban.timed_invalid_duration')}`});
    }
    until = new Date(Date.now() + args.duration * 1000);
  }

  let deleteMessageSeconds: number = 0;
  if (args.clean) {
    deleteMessageSeconds = Math.max(Math.min(args.clean, 7 * 24 * 60 * 60), 0);
  }

  // built in a given language: the server's for the audit log (the whole server sees it), the member's for their dm
  // the reason goes last since it can be multiple lines (discord caps audit log reasons at 512 characters, so only the
  // end of a long reason gets cut off)
  const createReason = (translator: Translator): string => {
    const description: Array<string> = [];
    description.push(translator.translate('moderation_ban.admin', {user: formatUserTag(context.user), user2: context.user.id}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translator.translate('moderation_ban.timestamp', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    if (deleteMessageSeconds) {
      description.push(((deleteMessageSeconds === 1) ? translator.translate('moderation_ban.message_cleaning_of_second_one', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(translator.language)}) : translator.translate('moderation_ban.message_cleaning_of_seconds_other', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(translator.language)})));
    }
    if (until) {
      description.push(translator.translate('moderation_ban.type_timed', {
        duration: formatTime(args.duration! * 1000),
        until: createTimestampMomentFromGuild(until.getTime(), context.guildId).format(DateMomentLogFormat),
      }));
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
          return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate(key, {limit: String(information.limit)})}`});
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

  const failed: Array<{error: any, memberOrUser: Structures.Member | Structures.User}> = [];
  // ban through rest by guild id so an uncached guild still bans (and the summary reflects what actually happened)
  for (let memberOrUser of canEdit) {
    /*
    let doesBanExist = false;
    try {
      await guild.fetchBan(memberOrUser.id);
      doesBanExist = true;
    } catch(error) {
      // does not exist
    }
    if (!doesBanExist) {
    */
    if (!guildId) {
      failed.push({error: new Error('Unknown Guild'), memberOrUser});
      continue;
    }

    if (guild && memberOrUser instanceof Structures.Member) {
      try {
        // in their language (or the server's), not the moderator's
        const dm = await getTranslatorForUser(context, memberOrUser.id);
        const dmReason = (dm.language === auditTranslator.language) ? reason : createReason(dm);
        await memberOrUser.createMessage([
          dm.translate('moderation_ban.you_have_been_banned_from', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          dm.translate('moderation_ban.information', {reason: Markup.codeblock(dmReason)}),
        ].join('\n'));
      } catch(error) {
        // maybe log this?
      }
    }

    // one failure (rate limit, 5xx, missing permissions) shouldn't stop the rest or the summary
    try {
      await context.rest.createGuildBan(guildId, memberOrUser.id, {deleteMessageSeconds, reason});
    } catch(error) {
      failed.push({error, memberOrUser});
    }
  }
  for (let { memberOrUser } of failed) {
    canEdit.splice(canEdit.indexOf(memberOrUser), 1);
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

  return displayReply(context, display);
}
