import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors, PermissionsText, StatusEmojis } from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply, formatDuration, formatUserTag } from '../../../utils';


export interface CommandArgsBefore {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_ID = 'moderation.kick';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { label, language, translate } = await getTranslator(context);
  const { payload } = args;

  // cleaning messages bans then unbans the member, so it needs the same permissions as a ban
  if (args.clean && 0 < args.clean) {
    const permissions = Markup.codestring(label('permissions', (PermissionsText as any)[String(Permissions.BAN_MEMBERS)]));
    const command = Markup.codestring(`${COMMAND_ID} -clean`);
    if (!context.member || !context.member.can(Permissions.BAN_MEMBERS)) {
      return displayReply(context, {
        description: `${StatusEmojis.WARNING} ${translate('errors.prefix_user_missing_permissions', {command, permissions})}`,
      });
    }
    if (!context.me || !context.me.can(Permissions.BAN_MEMBERS)) {
      return displayReply(context, {
        description: `${StatusEmojis.WARNING} ${translate('errors.prefix_bot_missing_permissions', {command, permissions})}`,
      });
    }
  }

  const canEdit: Array<Structures.Member> = [];
  const cannotEdit: Array<Structures.Member> = [];
  const clientCannotEdit: Array<Structures.Member> = [];
  const us: Array<Structures.Member> = [];

  const admin = context.member;
  const me = context.me;
  for (let member of payload.membersOrUsers) {
    if (me && me.id === member.id) {
      us.push(member);
    } else if (admin && admin.id === member.id) {
      us.push(member);
    } else if (!me || !me.canEdit(member)) {
      clientCannotEdit.push(member);
    } else if (!admin || !admin.canEdit(member)) {
      cannotEdit.push(member);
    } else {
      canEdit.push(member);
    }
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
    description.push(translator.translate('moderation_kick.moderator', {user: formatUserTag(context.user), user2: context.user.id}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translator.translate('moderation_kick.date', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    if (deleteMessageSeconds) {
      // the audit log only shows a ban and an unban for these, so say it was a kick
      description.push(translator.translate('moderation_kick.type_kick_cleaning'));
      description.push(translator.translate('moderation_kick.message_cleaning', {duration: formatDuration(deleteMessageSeconds * 1000, translator.language)}));
    }
    description.push(translator.translate('moderation_kick.reason', {text: payload.text || translator.translate('moderation.unspecified_reason')}));
    return description.join('\n').slice(0, 512);
  };
  const auditTranslator = await getGuildTranslator(context);
  const reason = createReason(auditTranslator);

  const guild = context.guild;
  const failed: Array<{error: any, member: Structures.Member}> = [];
  for (let member of canEdit) {
    if (guild) {
      try {
        // in their language (or the server's), not the moderator's
        const dm = await getTranslatorForUser(context, member.id);
        const dmReason = (dm.language === auditTranslator.language) ? reason : createReason(dm);
        await member.createMessage([
          dm.translate('moderation_kick.you_have_been_kicked_from', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          dm.translate('moderation_kick.details', {reason: Markup.codeblock(dmReason)}),
        ].join('\n'));
      } catch(error) {
        // maybe log this?
      }
    }

    // one failure (rate limit, 5xx, missing permissions) shouldn't stop the rest or the summary
    try {
      if (deleteMessageSeconds) {
        await member.ban({deleteMessageSeconds, reason});
        try {
          await member.removeBan({reason});
        } catch(error) {
          // retry once, otherwise a kick would leave them banned
          await member.removeBan({reason});
        }
      } else {
        await member.remove({reason});
      }
    } catch(error) {
      failed.push({error, member});
    }
  }
  for (let { member } of failed) {
    canEdit.splice(canEdit.indexOf(member), 1);
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
        description.push(translate('moderation_kick.audit_log_reason', {reason: Markup.codeblock(reason)}));
      }
      description.push('\u200b');
    }
    if (description.length) {
      display.fields!.push({name: translate('moderation_kick.kicked'), value: description.join('\n')});
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length || clientCannotEdit.length) {
      if (clientCannotEdit.length) {
        const members = clientCannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push(translate('moderation_kick.couldn_t_kick_due_to_bot_s'));
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push(translate('moderation_kick.couldn_t_kick_due_to_your_role'));
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (failed.length) {
      description.push(translate('moderation_kick.couldn_t_kick_errored'));
      for (let { error, member } of failed) {
        description.push(`-> ${member.mention} ${Markup.spoiler(`(${member})`)} ${Markup.codestring(String((error && error.message) || error).slice(0, 100))}`);
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push(translate('moderation_kick.cannot_kick_yourself_or_myself'));
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      display.fields!.push({name: translate('moderation_kick.unable_to_kick'), value: description.join('\n')});
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    display.fields!.push({name: translate('moderation_kick.not_found'), value: text});
  }

  {
    const kicked = canEdit.length;
    const unableToKick = cannotEdit.length + clientCannotEdit.length + us.length + failed.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (kicked) {
      description.push((1 < kicked) ? translate('moderation_kick.kicked_members', {kicked: kicked.toLocaleString(language)}) : translate('moderation_kick.kicked_member', {kicked: kicked.toLocaleString(language)}));
    }
    if (unableToKick) {
      description.push((1 < unableToKick) ? translate('moderation_kick.unable_to_kick_members', {unableToKick: unableToKick.toLocaleString(language)}) : translate('moderation_kick.unable_to_kick_member', {unableToKick: unableToKick.toLocaleString(language)}));
    }
    if (notFound) {
      description.push((1 < notFound) ? translate('moderation_kick.unable_to_find_members', {notFound: notFound.toLocaleString(language)}) : translate('moderation_kick.unable_to_find_member', {notFound: notFound.toLocaleString(language)}));
    }
    if (description.length) {
      display.footer = description.join(', ');
    }
  }

  return displayReply(context, display);
}
