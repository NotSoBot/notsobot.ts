import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
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
    description.push(`Admin: ${context.user} (${context.user.id})`);
    description.push(`Reason: ${(payload.text) ? Markup.escape.all(payload.text) : '[Unspecified Reason]'}`);
    {
      const timestamp = createTimestampMomentFromGuild(Date.now(), context.guildId);
      description.push(`Timestamp: ${timestamp.format(DateMomentLogFormat)}`);
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
        description.push(`Audit Log Reason: ${Markup.codeblock(reason)}`);
      }
      description.push('\u200b');
    }
    if (description.length) {
      embed.addField('Unbanned', description.join('\n'));
    }
  }

  {
    const description: Array<string> = [];
    if (cannotEdit.length) {
      description.push('');
      if (cannotEdit.length) {
        const members = cannotEdit.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
        description.push('Couldn\'t unban because they ain\'t banned');
        for (let member of members) {
          description.push(`-> ${member}`);
        }
      }
      description.push('');
    }

    if (us.length) {
      const members = us.map((member) => `${member.mention} ${Markup.spoiler(`(${member})`)}`);
      description.push('Cannot Unban Yourself or Myself');
      for (let member of members) {
        description.push(`-> ${member}`);
      }
    }

    if (description.length) {
      embed.addField('Unable to Unban', description.join('\n'));
    }
  }

  if (payload.notFound.length) {
    const text = payload.notFound.map((notFound) => Markup.escape.all(notFound)).join(', ');
    embed.addField('Not Found', text);
  }

  {
    const unbanned = canEdit.length;
    const unableToBan = cannotEdit.length + us.length;
    const notFound = payload.notFound.length;

    const description: Array<string> = [];
    if (unbanned) {
      const text = 'Member' + ((1 < unbanned) ? 's' : '');
      description.push(`Unbanned ${unbanned.toLocaleString()} ${text}`);
    }
    if (unableToBan) {
      const text = 'Member' + ((1 < unableToBan) ? 's' : '');
      description.push(`Unable to Unban ${unableToBan.toLocaleString()} ${text}`);
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
