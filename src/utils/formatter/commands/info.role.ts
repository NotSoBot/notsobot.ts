import { Command, Interaction, Structures } from 'detritus-client';
import { Markup, intToHex, intToRGB } from 'detritus-client/lib/utils';

import {
  DateOptions,
  PermissionsText,
  StatusEmojis,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
} from '../../../constants';
import { Endpoints } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  createColorUrl,
  displayReply,
  padCodeBlockFromRows,
  permissionsToObject,
  toCodePointForTwemoji,
} from '../../../utils';


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

  const payload: DisplayPayload = {fields: []};
  payload.title = role.name;
  payload.description = translate('info.role.description', {role: role.mention, channel: channel.mention});

  if (role.color) {
    payload.color = role.color;
  }

  // the role's icon wins, then its unicode emoji, then its color
  if (role.icon) {
    payload.thumbnail = role.iconUrlFormat(null, {size: 512}) as string;
  } else if (role.unicodeEmoji) {
    payload.thumbnail = Endpoints.CUSTOM.TWEMOJI_PNG(toCodePointForTwemoji(role.unicodeEmoji));
  } else if (role.color) {
    payload.thumbnail = createColorUrl(role.color, 128, 128);
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

    payload.fields!.push({inline: true, name: translate('common.information'), value: description.join('\n')});
  }

  {
    const description: Array<string> = [];

    description.push(`${translate('counts.members')}: ${role.members.length.toLocaleString(language)}`);
    if (description.length) {
      payload.fields!.push({inline: true, name: translate('common.counts'), value: Markup.codeblock(description.join('\n'), {language: 'css'})});
    }
  }

  payload.fields!.push({name: '\u200b', value: '\u200b'});

  {
    const permissions = permissionsToObject(role.permissionsIn(channel as Structures.ChannelGuildBase));

    {
      const rows: Array<Array<string>> = [];

      for (const permission of PERMISSIONS_ADMIN) {
        const key = String(permission);
        const can = permissions[key];
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      payload.fields!.push({inline: true, name: translate('info.role.moderation'), value: Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'})});
    }

    if (channel.isText) {
      const rows: Array<Array<string>> = [];

      for (const permission of PERMISSIONS_TEXT) {
        const key = String(permission);
        const can = permissions[key];
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      payload.fields!.push({inline: true, name: translate('info.role.text'), value: Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'})});
    } else if (channel.isVoice) {
      const rows: Array<Array<string>> = [];

      for (const permission of PERMISSIONS_VOICE) {
        const key = String(permission);
        const can = permissions[key];
        rows.push([`${label('permissions', PermissionsText[key])}:`, `${(can) ? StatusEmojis.YES : StatusEmojis.NO}`]);
      }

      payload.fields!.push({inline: true, name: translate('info.role.voice'), value: Markup.codeblock(padCodeBlockFromRows(rows).join('\n'), {language: 'css'})});
    }
  }

  return displayReply(context, payload);
}
