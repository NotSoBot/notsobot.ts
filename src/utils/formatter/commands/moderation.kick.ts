import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply } from '../../../utils';


export interface CommandArgsBefore {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_ID = 'kick';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { payload } = args;

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

  let reason: string | undefined;
  {
    const description: Array<string> = [];
    description.push(translate('moderation_kick.admin', {user: context.user, user2: context.user.id}));
    description.push(translate('moderation_kick.reason', {text: (payload.text) ? Markup.escape.all(payload.text) : translate('moderation.unspecified_reason')}));
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(translate('moderation_kick.timestamp', {timestamp: timestamp.format(DateMomentLogFormat)}));
    }
    if (deleteMessageSeconds) {
      description.push(((deleteMessageSeconds === 1) ? translate('moderation_kick.type_kick_w_message_cleaning_of_second_one', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(language)}) : translate('moderation_kick.type_kick_w_message_cleaning_of_seconds_other', {deleteMessageSeconds: deleteMessageSeconds.toLocaleString(language)})));
    }
    reason = description.join('\n');
  }

  const guild = context.guild;
  for (let member of canEdit) {
    if (guild) {
      try {
        await member.createMessage([
          translate('moderation_kick.you_have_been_kicked_from', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          translate('moderation_kick.information', {reason: Markup.codeblock(reason)}),
        ].join('\n'));
      } catch(error) {
        // maybe log this?
      }
    }

    if (deleteMessageSeconds) {
      await member.ban({deleteMessageSeconds, reason});
      await member.removeBan({reason});
    } else {
      await member.remove({reason});
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
    const unableToKick = cannotEdit.length + clientCannotEdit.length + us.length;
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
