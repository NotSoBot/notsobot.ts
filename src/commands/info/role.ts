import { Command, CommandClient, Constants, Structures, Utils } from 'detritus-client';
const { Permissions } = Constants;
const { Embed, Markup, PermissionTools, intToHex } = Utils;

import {
  BooleanEmojis,
  CommandTypes,
  DateOptions,
  PermissionsText,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
} from '../../constants';
import { isSnowflake, padCodeBlockFromRows } from '../../utils';

import { BaseCommand } from '../basecommand';


export function getChannel(value: string, context: Command.Context) {
  if (value) {
    const guild = context.guild;
    if (guild) {
      return guild.channels.get(value);
    }
  }
  return context.channel;
}

export function getRole(value: string, context: Command.Context) {
  const guild = context.guild;

  if (guild) {
    if (value) {
      if (isSnowflake(value)) {
        return guild.roles.get(value);
      } else {
        const name = value.toLowerCase();
        return guild.roles.find((role) => {
          return role.name.toLowerCase().includes(name);
        });
      }
    }
    return guild.defaultRole;
  }
};


export interface CommandArgsBefore {
  channel: Structures.Channel | undefined,
  role: Structures.Role | undefined,
}

export interface CommandArgs {
  channel: Structures.Channel,
  role: Structures.Role,
}

export default class RoleCommand extends BaseCommand {
  name = 'role';

  disableDm = true;
  metadata = {
    description: 'Get information for a role, defaults to the @everyone role',
    examples: [
      'role',
      'role everyone',
    ],
    type: CommandTypes.INFO,
    usage: 'role ?<id|mention|name> (-channel <id>)',
  };
  type = getRole;

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{default: (context: Command.Context) => context.channel, name: 'channel', type: getChannel}],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.channel && !!args.role;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.channel) {
      return context.editOrReply('Unknown Channel');
    } else if (!args.role) {
      return context.editOrReply('Unknown Role');
    }
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channel, role } = args;

    const embed = new Embed();

    embed.setAuthor(role.name);
    embed.setDescription(`Showing channel permissions for ${role.mention} in ${channel.mention}`);

    if (role.color) {
      embed.setColor(role.color);
    }

    {
      const description: Array<string> = [];

      description.push(`**Color**: ${(role.color) ? `\`${intToHex(role.color, true)}\`` : 'No Color'}`);
      description.push(`**Created**: ${role.createdAt.toLocaleString('en-US', DateOptions)}`);
      description.push(`**Default Role**: ${(role.isDefault) ? 'Yes' : 'No'}`);
      description.push(`**Hoisted**: ${(role.hoist) ? 'Yes' : 'No'}`);
      description.push(`**Id**: \`${role.id}\``);
      description.push(`**Managed**: ${(role.managed) ? 'Yes' : 'No'}`);
      description.push(`**Mentionable**: ${(role.mentionable) ? 'Yes' : 'No'}`);
      if (role.guild) {
        const position = role.guild.roles.sort((x, y) => x.position - y.position).findIndex((r) => r.id === role.id) + 1;
        description.push(`**Position**: ${role.position} (${position}/${role.guild.roles.length})`);
      } else {
        description.push(`**Position**: ${role.position}`);
      }

      embed.addField('Information', description.join('\n'), true);
    }

    {
      const description: Array<string> = [];

      description.push(`Members: ${role.members.length.toLocaleString()}`);

      if (description.length) {
        embed.addField('Counts', Markup.codeblock(description.join('\n'), {language: 'css'}), true);
      }
    }

    if (channel) {
      const permissions = role.permissionsIn(channel);

      {
        const rows: Array<Array<string>> = [];
  
        for (const permission of PERMISSIONS_ADMIN) {
          const can = PermissionTools.checkPermissions(permissions, permission);
          rows.push([`${PermissionsText[permission]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }
  
        embed.addField('Moderation', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      }

      if (channel.isText) {
        const rows: Array<Array<string>> = [];

        for (const permission of PERMISSIONS_TEXT) {
          const can = PermissionTools.checkPermissions(permissions, permission);
          rows.push([`${PermissionsText[permission]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Text', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      } else if (channel.isVoice) {
        const rows: Array<Array<string>> = [];

        for (const permission of PERMISSIONS_VOICE) {
          const can = PermissionTools.checkPermissions(permissions, permission);
          rows.push([`${PermissionsText[permission]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Voice', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      }

      return context.editOrReply({content: '', embed});
    }
  }
}
