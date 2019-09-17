import { Command, Constants, Structures, Utils } from 'detritus-client';

const { Permissions } = Constants;
const { PermissionTools } = Utils;

import {
  BooleanEmojis,
  DateOptions,
  PermissionsText,
  PERMISSIONS_KEYS_ADMIN,
  PERMISSIONS_KEYS_TEXT,
  PERMISSIONS_KEYS_VOICE,
} from '../constants';
import { isSnowflake, padCodeBlockFromRows } from '../utils';


export interface CommandArgs {
  channel: Structures.Channel,
  role: Structures.Role,
}

export default (<Command.CommandOptions> {
  name: 'role',
  args: [{name: 'channel', type: (value, context) => context.channel}],
  disableDm: true,
  type: (value, context) => {
    value = value.trim();
    const guild = context.guild;

    let role: null | Structures.Role | undefined;
    if (guild) {
      if (value) {
        if (isSnowflake(value)) {
          role = guild.roles.get(value);
        } else {
          const name = value.toLowerCase();
          role = guild.roles.find((role) => {
            return role.name.toLowerCase().includes(name);
          });
        }
      } else {
        role = guild.defaultRole;
      }
    }
    return role || null;
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  onBeforeRun: (context, args) => !!args.channel && !!args.role,
  onCancelRun: (context, args) => {
    if (!args.channel) {
      return context.editOrReply('Unknown Channel');
    } else if (!args.role) {
      return context.editOrReply('Unknown Role');
    }
  },
  run: async (context, args) => {
    args = <CommandArgs> <unknown> args;
    const { channel, role } = args;

    const embed = new Utils.Embed();

    embed.setAuthor(role.name);
    embed.setDescription(`Showing channel permissions for ${role.mention} in ${channel.mention}`);

    if (role.color) {
      embed.setColor(role.color);
    }

    {
      const description: Array<string> = [];

      description.push(`**Created**: ${role.createdAt.toLocaleString('en-US', DateOptions)}`);
      description.push(`**Default Role**: ${(role.isDefault) ? 'Yes' : 'No'}`);

      embed.addField('Information', description.join('\n'));
    }

    {
      const rows: Array<Array<string>> = [];

      for (const key of PERMISSIONS_KEYS_ADMIN) {
        const can = PermissionTools.checkPermissions(role.permissions, (<any> Permissions)[key]);
        rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
      }

      embed.addField('Moderation', [
        '```css',
        padCodeBlockFromRows(rows).join('\n'),
        '```',
      ].join('\n'), true);
    }

    if (channel) {
      const permissions = role.permissionsIn(channel);
      if (channel.isText) {
        const rows: Array<Array<string>> = [];

        for (const key of PERMISSIONS_KEYS_TEXT) {
          const can = PermissionTools.checkPermissions(permissions, (<any> Permissions)[key]);
          rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Text', [
          '```css',
          padCodeBlockFromRows(rows).join('\n'),
          '```',
        ].join('\n'), true);
      } else if (channel.isVoice) {
        const rows: Array<Array<string>> = [];

        for (const key of PERMISSIONS_KEYS_VOICE) {
          const can = PermissionTools.checkPermissions(permissions, (<any> Permissions)[key]);
          rows.push([`${PermissionsText[key]}:`, `${(can) ? BooleanEmojis.YES : BooleanEmojis.NO}`]);
        }

        embed.addField('Voice', [
          '```css',
          padCodeBlockFromRows(rows).join('\n'),
          '```',
        ].join('\n'), true);
      }

      return context.editOrReply({content: '', embed});
    }
  },
  onRunError: (context, args, error) => {
    console.log(error);
  },
});
