import * as moment from 'moment';

import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../constants';
import { Parameters, createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  clean?: number,
  payload: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_NAME = 'kick';

export default class KickCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clean', type: Parameters.days},
      ],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        description: 'Kick multiple members, add a reason, and clean their messages.',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 -clean 1 day`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
        ],
        type: CommandTypes.MODERATION,
        usage: '...?<user:id|mention> <reason (string)> (-clean <days>)',
      },
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS, Permissions.KICK_MEMBERS],
      permissions: [Permissions.KICK_MEMBERS],
      type: Parameters.banPayload({membersOnly: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.payload) {
      return context.editOrReply('⚠ Couldn\'t find any members. (Use Mentions or User IDs)');
    }
    return context.editOrReply('⚠ Provide some members');
  }

  async run(context: Command.Context, args: CommandArgs) {
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

    let reason: string | undefined;
    {
      const description: Array<string> = [];
      description.push(`Admin: ${context.user} (${context.user.id})`);
      description.push(`Reason: ${(payload.text) ? Markup.escape.all(payload.text) : '[Unspecified Reason]'}`);
      description.push(`Timestamp: ${moment().format(DateMomentLogFormat)}`);
      if (args.clean) {
        description.push(`Type: Kick w/ Message Cleaning of ${Math.min(args.clean, 7)} days`);
      }
      reason = description.join('\n');
    }

    if (args.clean) {
      const deleteMessageDays = String(Math.min(args.clean, 7));
      for (let member of canEdit) {
        await member.ban({deleteMessageDays, reason});
        await member.removeBan({reason});
      }
    } else {
      for (let member of canEdit) {
        await member.remove({reason});
      }
    }

    const embed = createUserEmbed(context.user);
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

    return context.editOrReply({embed});
  }
}
