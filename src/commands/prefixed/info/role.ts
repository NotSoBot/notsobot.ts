import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, PermissionTools, intToHex, intToRGB } from 'detritus-client/lib/utils';

import {
  BooleanEmojis,
  CommandCategories,
  DateOptions,
  PermissionsText,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
} from '../../../constants';
import { DefaultParameters, Parameters, createColorUrl, editOrReply, padCodeBlockFromRows, permissionsToObject } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  channel: Structures.Channel | null,
  role: Structures.Role | null,
}

export interface CommandArgs {
  channel: Structures.Channel,
  role: Structures.Role,
}


export const COMMAND_NAME = 'role';

export default class RoleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'channel', default: DefaultParameters.channel, type: Parameters.channel()},
      ],
      default: DefaultParameters.defaultRole,
      disableDm: true,
      metadata: {
        description: 'Get information for a role, defaults to the @everyone role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} everyone`,
          `${COMMAND_NAME} everyone -channel lobby`,
        ],
        category: CommandCategories.INFO,
        usage: '?<role:id|mention|name> (-channel ?<channel:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.role,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.channel && !!args.role;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.channel) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that channel`);
    } else if (!args.role) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that role`);
    } else {
      return super.onCancelRun(context, args);
    }
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channel, role } = args;

    const embed = new Embed();
    embed.setAuthor(role.name);
    embed.setDescription(`Showing channel permissions for ${role.mention} in ${channel.mention}`);

    if (role.color) {
      embed.setColor(role.color);

      const url = createColorUrl(role.color);
      embed.setAuthor(role.name, url);
    }

    {
      const description: Array<string> = [];

      if (role.color) {
        const color = intToRGB(role.color);
        const hex = Markup.codestring(intToHex(role.color, true));
        const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
        description.push(`**Color**: ${hex} ${rgb}`);
      } else {
        description.push(`**Color**: No Color`);
      }
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
      if (role.tags) {
        if (role.isBoosterRole) {
          description.push('**Type**: Booster Role');
        } else if (role.botId) {
          description.push(`**Type**: Bot Role (for <@${role.botId}>)`);
        } else if (role.integrationId) {
          description.push(`**Type**: Integration Role (${role.integrationId})`);
        } else {
          description.push(`**Type**: Unknown (${JSON.stringify(role.tags)})`);
        }
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

    embed.addField('\u200b', '\u200b');

    {
      const permissions = permissionsToObject(role.permissionsIn(channel as Structures.ChannelGuildBase));

      {
        const rows: Array<Array<string>> = [];

        for (const permission of PERMISSIONS_ADMIN) {
          const key = String(permission);
          const can = permissions[key];
          rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Moderation', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      }

      if (channel.isText) {
        const rows: Array<Array<string>> = [];

        for (const permission of PERMISSIONS_TEXT) {
          const key = String(permission);
          const can = permissions[key];
          rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Text', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      } else if (channel.isVoice) {
        const rows: Array<Array<string>> = [];

        for (const permission of PERMISSIONS_VOICE) {
          const key = String(permission);
          const can = permissions[key];
          rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Voice', Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
      }
    }

    return editOrReply(context, {embed});
  }
}
