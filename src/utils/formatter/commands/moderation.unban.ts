import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildTimedBans } from '../../../api';
import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { getGuildTranslator, getTranslator } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply, formatUserTag } from '../../../utils';


export interface CommandArgsBefore {
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'moderation.unban';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const { payload } = args;

  const canEdit: Array<Structures.Member | Structures.User> = [];
  const cannotEdit: Array<Structures.Member | Structures.User> = [];
  const us: Array<Structures.Member | Structures.User> = [];

  const unsure: Array<Structures.Member | Structures.User> = [];
  const failed: Array<{error: any, memberOrUser: Structures.Member | Structures.User}> = [];

  // const bans = await context.rest.fetchGuildBans(context.guildId as string);

  const admin = context.member;
  const me = context.me;
  for (let member of payload.membersOrUsers) {
    if (me && me.id === member.id) {
      us.push(member);
    } else if (admin && admin.id === member.id) {
      us.push(member);
    } else if (member instanceof Structures.Member) {
      cannotEdit.push(member);
    } else {
      unsure.push(member);
    }
  }

  if (unsure.length) {
    /*
    const bans = await context.rest.fetchGuildBans(context.guildId!);
    for (let member of unsure) {
      if (bans.has(member.id)) {
        canEdit.push(member);
      } else {
        cannotEdit.push(member);
      }
    }
    */
    for (let member of unsure) {
      try {
        const ban = await context.rest.fetchGuildBan(context.guildId!, member.id);
        canEdit.push(member);
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          cannotEdit.push(member);
        } else {
          // don't let the target vanish from the result on non-404 errors
          failed.push({error, memberOrUser: member});
        }
      }
    }
  }

  let reason: string | undefined;
  {
    // in the server's language since the whole server sees it, and the reason goes last since it can be multiple lines
    // (discord caps audit log reasons at 512 characters, so only the end of a long reason gets cut off)
    const audit = await getGuildTranslator(context);
    const description: Array<string> = [];
    description.push(audit.translate('moderation_unban.moderator', {user: formatUserTag(context.user), user2: context.user.id}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(audit.translate('moderation_unban.date', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    description.push(audit.translate('moderation_unban.reason', {text: payload.text || audit.translate('moderation.unspecified_reason')}));
    reason = description.join('\n').slice(0, 512);
  }

  // unban through rest by guild id so an uncached guild still unbans, and one failure doesn't stop the rest
  for (let member of canEdit) {
    try {
      await context.rest.removeGuildBan(context.guildId!, member.id, {reason});
    } catch(error) {
      failed.push({error, memberOrUser: member});
    }
  }
  for (let { memberOrUser } of failed) {
    const index = canEdit.indexOf(memberOrUser);
    if (index !== -1) {
      canEdit.splice(index, 1);
    }
  }
  // they're not banned anymore, so a timed ban on them shouldn't do anything later
  if (context.guildId && canEdit.length) {
    try {
      await deleteGuildTimedBans(context, context.guildId, {userIds: canEdit.map((member) => member.id)});
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
      if (reason) {
        description.push('');
        description.push(translate('moderation_unban.audit_log_reason', {reason: Markup.codeblock(reason)}));
      }
      description.push('\u200b');
    }
    if (description.length) {
      display.fields!.push({name: translate('moderation_unban.unbanned'), value: description.join('\n')});
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length) {
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push(translate('moderation_unban.couldn_t_unban_because_they_ain_t'));
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (failed.length) {
      description.push(translate('moderation_unban.couldn_t_unban_errored'));
      for (let { error, memberOrUser } of failed) {
        description.push(`-> ${memberOrUser.mention} ${Markup.spoiler(`(${memberOrUser})`)} ${Markup.codestring(String((error && error.message) || error).slice(0, 100))}`);
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push(translate('moderation_unban.cannot_unban_yourself_or_myself'));
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      display.fields!.push({name: translate('moderation_unban.unable_to_unban'), value: description.join('\n')});
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    display.fields!.push({name: translate('moderation_unban.not_found'), value: text});
  }

  {
    const unbanned = canEdit.length;
    const unableToBan = cannotEdit.length + us.length + failed.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (unbanned) {
      description.push((1 < unbanned) ? translate('moderation_unban.unbanned_members', {unbanned: unbanned.toLocaleString(language)}) : translate('moderation_unban.unbanned_member', {unbanned: unbanned.toLocaleString(language)}));
    }
    if (unableToBan) {
      description.push((1 < unableToBan) ? translate('moderation_unban.unable_to_unban_members', {unableToBan: unableToBan.toLocaleString(language)}) : translate('moderation_unban.unable_to_unban_member', {unableToBan: unableToBan.toLocaleString(language)}));
    }
    if (notFound) {
      description.push((1 < notFound) ? translate('moderation_unban.unable_to_find_members', {notFound: notFound.toLocaleString(language)}) : translate('moderation_unban.unable_to_find_member', {notFound: notFound.toLocaleString(language)}));
    }
    if (description.length) {
      display.footer = description.join(', ');
    }
  }

  return displayReply(context, display);
}
