import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply } from '../../../utils';


export interface CommandArgsBefore {
  clean: number,
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  clean: number,
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'moderation.ban';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
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

  let deleteMessageSeconds: number = 0;
  if (args.clean) {
    deleteMessageSeconds = Math.max(Math.min(args.clean, 7 * 24 * 60 * 60), 0);
  }

  let reason: string | undefined;
  {
    const description: Array<string> = [];
    description.push(translate('moderation_ban.admin', {user: context.user, user2: context.user.id}));
    description.push(translate('moderation_ban.reason', {text: (payload.text) ? Markup.escape.all(payload.text) : translate('moderation.unspecified_reason')}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translate('moderation_ban.timestamp', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    if (deleteMessageSeconds) {
      description.push(((deleteMessageSeconds === 1) ? translate('moderation_ban.message_cleaning_of_second_one', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(language)}) : translate('moderation_ban.message_cleaning_of_seconds_other', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(language)})));
    }
    reason = description.join('\n');
  }

  const guild = context.guild;
  const guildId = context.guildId;
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
        await memberOrUser.createMessage([
          translate('moderation_ban.you_have_been_banned_from', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          translate('moderation_ban.information', {reason: Markup.codeblock(reason)}),
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
      description.push(translateMaybe('moderation_ban.couldn_t_ban_errored', 'Couldn\'t ban (the request failed)'));
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
