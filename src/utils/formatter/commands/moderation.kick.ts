import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';


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
    description.push(`Admin: ${context.user} (${context.user.id})`);
    description.push(`Reason: ${(payload.text) ? Markup.escape.all(payload.text) : '[Unspecified Reason]'}`);
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(`Timestamp: ${timestamp.format(DateMomentLogFormat)}`);
    }
    if (deleteMessageSeconds) {
      description.push(`Type: Kick w/ Message Cleaning of ${deleteMessageSeconds.toLocaleString()} second${(deleteMessageSeconds === 1) ? '' : 's'}`);
    }
    reason = description.join('\n');
  }

  const guild = context.guild;
  for (let member of canEdit) {
    if (guild) {
      try {
        await member.createMessage([
          `You have been kicked from ${Markup.escape.all(guild.name)} (${guild.id}).`,
          '',
          `Information: ${Markup.codeblock(reason)}`,
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
        description.push(`Audit Log Reason: ${Markup.codeblock(reason)}`);
      }
      description.push('\u200b');
    }
    if (description.length) {
      embed.addField('Kicked', description.join('\n'));
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length || clientCannotEdit.length) {
      if (clientCannotEdit.length) {
        const members = clientCannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push('Couldn\'t kick due to Bot\'s Role Position');
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push('Couldn\'t kick due to Your Role Position');
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push('Cannot Kick Yourself or Myself');
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      embed.addField('Unable to Kick', description.join('\n'));
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    embed.addField('Not Found', text);
  }

  {
    const kicked = canEdit.length;
    const unableToKick = cannotEdit.length + clientCannotEdit.length + us.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (kicked) {
      const text = 'Member' + ((1 < kicked) ? 's' : '');
      description.push(`Kicked ${kicked.toLocaleString()} ${text}`);
    }
    if (unableToKick) {
      const text = 'Member' + ((1 < unableToKick) ? 's' : '');
      description.push(`Unable to Kick ${unableToKick.toLocaleString()} ${text}`);
    }
    if (notFound) {
      const text = 'Member' + ((1 < notFound) ? 's' : '');
      description.push(`Unable to find ${notFound.toLocaleString()} ${text}`);
    }
    if (description.length) {
      embed.setFooter(description.join(', '));
    }
  }

  return editOrReply(context, {embed});
}
