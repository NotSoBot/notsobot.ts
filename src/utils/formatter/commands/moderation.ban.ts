import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  clean: number,
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  clean: number,
  payload: Parameters.BanPayload,
}

export const COMMAND_ID = 'ban';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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
    description.push(`Admin: ${context.user} (${context.user.id})`);
    description.push(`Reason: ${(payload.text) ? Markup.escape.all(payload.text) : '[Unspecified Reason]'}`);
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(`Timestamp: ${timestamp.format(DateMomentLogFormat)}`);
    }
    if (deleteMessageSeconds) {
      description.push(`Message Cleaning of ${deleteMessageSeconds.toLocaleString()} second${(deleteMessageSeconds === 1) ? '' : 's'}`);
    }
    reason = description.join('\n');
  }

  const guild = context.guild;
  if (guild) {
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

      if (memberOrUser instanceof Structures.Member) {
        try {
          await memberOrUser.createMessage([
            `You have been banned from ${Markup.escape.all(guild.name)} (${guild.id}).`,
            '',
            `Information: ${Markup.codeblock(reason)}`,
          ].join('\n'));
        } catch(error) {
          // maybe log this?
        }
      }

      await guild.createBan(memberOrUser.id, {deleteMessageSeconds, reason});
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
      embed.addField('Banned', description.join('\n'));
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length || clientCannotEdit.length) {
      if (clientCannotEdit.length) {
        const members = clientCannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push('Couldn\'t ban due to Bot\'s Role Position');
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push('Couldn\'t ban due to Your Role Position');
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push('Cannot Ban Yourself or Myself');
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      embed.addField('Unable to Ban', description.join('\n'));
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    embed.addField('Not Found', text);
  }

  {
    const banned = canEdit.length;
    const unableToBan = cannotEdit.length + clientCannotEdit.length + us.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (banned) {
      const text = 'Member' + ((1 < banned) ? 's' : '');
      description.push(`Banned ${banned.toLocaleString()} ${text}`);
    }
    if (unableToBan) {
      const text = 'Member' + ((1 < unableToBan) ? 's' : '');
      description.push(`Unable to Ban ${unableToBan.toLocaleString()} ${text}`);
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
