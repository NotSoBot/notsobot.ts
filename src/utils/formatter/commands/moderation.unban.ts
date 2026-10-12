import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'unban';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { payload } = args;

  const canEdit: Array<Structures.Member | Structures.User> = [];
  const cannotEdit: Array<Structures.Member | Structures.User> = [];
  const us: Array<Structures.Member | Structures.User> = [];

  const unsure: Array<Structures.Member | Structures.User> = [];

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
        }
      }
    }
  }

  let reason: string | undefined;
  {
    const description: Array<string> = [];
    description.push(translate('moderation_unban.admin', {user: context.user, user2: context.user.id}));
    description.push(translate('moderation_unban.reason', {text: (payload.text) ? Markup.escape.all(payload.text) : translate('moderation.unspecified_reason')}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translate('moderation_unban.timestamp', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    reason = description.join('\n');
  }

  const guild = context.guild;
  if (guild) {
    for (let member of canEdit) {
      await guild.removeBan(member.id, {reason});
    }
  }

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
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
      embed.addField(translate('moderation_unban.unbanned'), description.join('\n'));
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

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push(translate('moderation_unban.cannot_unban_yourself_or_myself'));
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      embed.addField(translate('moderation_unban.unable_to_unban'), description.join('\n'));
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    embed.addField(translate('moderation_unban.not_found'), text);
  }

  {
    const unbanned = canEdit.length;
    const unableToBan = cannotEdit.length + us.length;
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
      embed.setFooter(description.join(', '));
    }
  }

  return editOrReply(context, {embed});
}
