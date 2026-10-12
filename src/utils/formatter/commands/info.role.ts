import { Command, Interaction, Structures } from 'detritus-client';
import { Embed, Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';

import {
  DateOptions,
  PermissionsText,
  StatusEmojis,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
} from '../../../constants';
import { getTranslator } from '../../i18n';
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
  const { label, language, translate, translateMaybe } = await getTranslator(context);

  const { channel, role } = args;

  const embed = new Embed();
  embed.setAuthor(role.name);
  embed.setDescription(translate('info.role.description', {role: role.mention, channel: channel.mention}));

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
      description.push(`**${translate('info.role.color')}**: ${hex} ${rgb}`);
    } else {
      description.push(`**${translate('info.role.color')}**: ${translate('info.role.no_color')}`);
    }
    description.push(`**${translate('common.created')}**: ${role.createdAt.toLocaleString(language, DateOptions)}`);
    description.push(`**${translate('info.role.default_role')}**: ${(role.isDefault) ? translate('common.yes') : translate('common.no')}`);
    description.push(`**${translate('info.role.hoisted')}**: ${(role.hoist) ? translate('common.yes') : translate('common.no')}`);
    description.push(`**${translate('common.id')}**: \`${role.id}\``);
    description.push(`**${translate('common.managed')}**: ${(role.managed) ? translate('common.yes') : translate('common.no')}`);
    description.push(`**${translate('info.role.mentionable')}**: ${(role.mentionable) ? translate('common.yes') : translate('common.no')}`);
    if (role.guild) {
      const position = role.guild.roles.sort((x, y) => x.position - y.position).findIndex((r) => r.id === role.id) + 1;
      description.push(`**${translate('common.position')}**: ${role.position} (${position}/${role.guild.roles.length})`);
    } else {
      description.push(`**${translate('common.position')}**: ${role.position}`);
    }
    if (role.tags) {
      if (role.isBoosterRole) {
        description.push(`**${translate('common.type')}**: ${translate('info.role.booster_role')}`);
      } else if (role.botId) {
        description.push(`**${translate('common.type')}**: ${translate('info.role.bot_role', {bot: `<@${role.botId}>`})}`);
      } else if (role.subscriptionListingId) {
        description.push(`**${translate('common.type')}**: ${translate('info.role.subscription_role', {id: role.subscriptionListingId})}`);
      } else if (role.tags.guildConnections) {
        description.push(`**${translate('common.type')}**: ${translate('info.role.linked_role')}`);
      } else if (role.integrationId) {
        description.push(`**${translate('common.type')}**: ${translate('info.role.integration_role', {id: String(role.integrationId)})}`);
      } else {
        description.push(`**${translate('common.type')}**: ${translate('common.unknown_value', {value: JSON.stringify(role.tags)})}`);
      }
    }

    embed.addField(translate('common.information'), description.join('\n'), true);
  }

  {
    const description: Array<string> = [];

    description.push(`${translate('counts.members')}: ${role.members.length.toLocaleString(language)}`);
    if (description.length) {
      embed.addField(translate('common.counts'), Markup.codeblock(description.join('\n'), {language: 'css'}), true);
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
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      embed.addField(translate('info.role.moderation'), Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
    }

    if (channel.isText) {
      const rows: Array<Array<string>> = [];

      for (const permission of PERMISSIONS_TEXT) {
        const key = String(permission);
        const can = permissions[key];
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      embed.addField(translate('info.role.text'), Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
    } else if (channel.isVoice) {
      const rows: Array<Array<string>> = [];

      for (const permission of PERMISSIONS_VOICE) {
        const key = String(permission);
        const can = permissions[key];
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      embed.addField(translate('info.role.voice'), Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'}), true);
    }
  }

  return editOrReply(context, {embed});
}
