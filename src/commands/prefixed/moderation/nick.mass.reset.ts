import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../../stores/serverexecutions';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { ERROR_CODES_IGNORE, MAX_MEMBERS, RATELIMIT_TIME } from './nick.mass';


export interface CommandArgsBefore {
  nobots?: boolean,
  nousers?: boolean,
  role?: null | Structures.Role,
  text: string,
}

export interface CommandArgs {
  nobots: boolean,
  nousers: boolean,
  role?: null | Structures.Role,
  text: string,
}

export const COMMAND_NAME = 'nick mass reset';

export default class NickMassResetCommand extends BaseCommand {
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
        description: 'Reset the nickname of multiple members',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -role admin`,
          `${COMMAND_NAME} -nobots`,
          `${COMMAND_NAME} -nousers`,
        ],
        type: CommandTypes.MODERATION,
        usage: '(-nobots) (-nousers) (-role <role:id|name>)',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
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
    return true;
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
      return !!member.nick && me.canEdit(member);
    });

    const [ amount, time ] = RATELIMIT_TIME;

    const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
    if (isExecuting.nick) {
      return context.reply('already mass editing nicks');
    }

    const embed = new Embed();
    embed.setTitle(`Clearing Nicknames of ${members.length.toLocaleString()} out of ${guild.members.length.toLocaleString()} members`);
    embed.setDescription(`Should take about ${((members.length / amount) * time).toLocaleString()} seconds`);

    const message = await context.reply({embed});

    const amounts = {
      changed: 0,
      failed: 0,
      skipped: 0,
    };
    const errors: Array<any> = [];
    const reason = `Mass Nickname reset by ${context.user} (${context.user.id})`;

    isExecuting.nick = true;
    for (let member of members) {
      if (!isExecuting.nick) {
        break;
      }

      if (!member.nick) {
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
        await member.editNick('', {reason});
        amounts.changed++;
      } catch(error) {
        if (error.response && ERROR_CODES_IGNORE.includes(error.response.statusCode)) {
          errors.push(error);
        } else {
          throw error;
        }
      }
    }

    if (!isExecuting.nick) {
      embed.setDescription(`Mass Nickname Reset Canceled`);
      return (message.deleted) ? context.reply({embed}) : message.edit({embed});
    }
    isExecuting.nick = false;

    {
      const description: Array<string> = [];
      description.push(`Finished clearing ${members.length.toLocaleString()} members's nicknames`);
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
