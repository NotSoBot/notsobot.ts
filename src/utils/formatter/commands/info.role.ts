import { Command, Interaction, Structures } from 'detritus-client';
import { Embed, Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';

import {
  BooleanEmojis,
  DateOptions,
  PermissionsText,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
} from '../../../constants';
import { createColorUrl, editOrReply, padCodeBlockFromRows, permissionsToObject } from '../../../utils';


export interface CommandArgsBefore {
  channel: Structures.Channel | null,
  role: Structures.Role | null,
}

export interface CommandArgs {
  channel: Structures.Channel,
  role: Structures.Role,
}


export const COMMAND_ID = 'role';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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
