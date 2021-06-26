import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../stores/serverexecutions';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export const ERROR_CODES_IGNORE = [400, 403];
export const MAX_MEMBERS = 1000;
export const RATELIMIT_TIME = [10, 10]; // 10 members per 10 seconds (use a constant incase it changes in the future)

export interface CommandArgsBefore {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}

export interface CommandArgs {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}

export const COMMAND_NAME = 'nick mass';

export default class NickMassCommand extends BaseCommand {
  triggerTypingAfter = -1;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'nobots', type: Boolean},
        {name: 'nousers', type: Boolean},
        {name: 'role', type: Parameters.role},
      ],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Change the nickname of multiple members',
        examples: [
          `${COMMAND_NAME} troy`,
          `${COMMAND_NAME} troy -role admin`,
          `${COMMAND_NAME} troy -nobots`,
          `${COMMAND_NAME} troy -nousers`,
        ],
        type: CommandTypes.MODERATION,
        usage: '<text> (-nobots) (-nousers) (-role <role:id|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  onBefore(context: Command.Context) {
    return (context.guild) ? context.guild.memberCount <= MAX_MEMBERS : false;
  }

  onCancel(context: Command.Context) {
    if (context.guild && MAX_MEMBERS < context.guild.memberCount) {
      return editOrReply(context, `Cannot mass nick edit on servers with more than ${MAX_MEMBERS.toLocaleString()} members`);
    }
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    if (args.nobots && args.nousers) {
      return false;
    }
    return !!args.text;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.role === null) {
      return editOrReply(context, '⚠ Unknown Role');
    }
    if (args.nobots && args.nousers) {
      return editOrReply(context, '⚠ who then?!');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;
    const me = guild.me as Structures.Member;

    const nick = args.text.slice(0, 32);

    const members = guild.members.filter((member) => {
      if (args.nobots && member.bot) {
        return false;
      }
      if (args.nousers && !member.bot) {
        return false;
      }
      if (args.role && !member.roles.has(args.role.id)) {
        return false;
      }
      return member.name !== nick && me.canEdit(member);
    });

    const [ amount, time ] = RATELIMIT_TIME;

    const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
    if (isExecuting.nick) {
      return context.reply('already mass editing nicks');
    }

    const embed = new Embed();
    embed.setTitle(`Changing Nicknames of ${members.length.toLocaleString()} out of ${guild.members.length.toLocaleString()} members`);
    embed.setDescription(`Should take about ${((members.length / amount) * time).toLocaleString()} seconds`);

    const message = await context.reply({embed});

    const amounts = {
      changed: 0,
      failed: 0,
      skipped: 0,
    };
    const errors: Array<any> = [];
    const reason = `Mass Nickname change by ${context.user} (${context.user.id})`;

    isExecuting.nick = true;
    for (let member of members) {
      if (!isExecuting.nick) {
        break;
      }

      if (member.name === nick) {
        amounts.skipped++;
        continue;
      }

      if (member.isMe) {
        if (!me.canChangeNickname) {
          amounts.failed++;
          continue;
        }
      } else if (!me.canEdit(member) || !me.canChangeNicknames) {
        amounts.failed++;
        continue;
      }

      try {
        await member.editNick(nick, {reason});
        amounts.changed++;
      } catch(error) {
        if (error.response && ERROR_CODES_IGNORE.includes(error.response.statusCode)) {
          errors.push(error);
        } else {
          error.metadata = {
            canEdit: me.canEdit(member),
            canChangeNicknames: me.canChangeNicknames,
            user: member.user,
          };
          throw error;
        }
      }
    }

    if (!isExecuting.nick) {
      embed.setDescription(`Mass Nickname Canceled`);
      return (message.deleted) ? context.reply({embed}) : message.edit({embed});
    }
    isExecuting.nick = false;

    {
      const description: Array<string> = [];
      description.push(`Finished editing ${members.length.toLocaleString()} members`);
      if (amounts.skipped || amounts.failed || errors.length) {
        description.push('');
        if (amounts.skipped) {
          description.push(`Skipped ${amounts.skipped.toLocaleString()} members`);
        }
        if (amounts.failed) {
          description.push(`Failed to edit ${amounts.failed.toLocaleString()} members due to permissions`);
        }
        if (errors.length) {
          description.push(`Failed to edit ${errors.length.toLocaleString()} members due to some unknown error`);
        }
      }
      embed.setDescription(description.join('\n'));

      return (message.deleted) ? context.reply({embed}) : message.edit({embed});
    }
  }
}
