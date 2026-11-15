import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup, PermissionTools, intToHex, intToRGB } from 'detritus-client/lib/utils';

import { PermissionsText, PERMISSIONS_ADMIN } from '../../../constants';
import { Endpoints } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  createColorUrl,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
  slashCommandMention,
  toCodePointForTwemoji,
} from '../../../utils';


export interface CommandArgsBefore {
  role: Structures.Role | null,
}

export interface CommandArgs {
  role: Structures.Role,
}


export const COMMAND_ID = 'info.role';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { label, language, translate, translateMaybe } = await getTranslator(context);

  const { role } = args;

  const payload: DisplayPayload = {};
  payload.title = role.name;

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

  const lines: Array<string> = [(role.isDefault) ? '@everyone' : role.mention];

  {
    let color: string | null = null;
    if (role.color) {
      const rgb = intToRGB(role.color);
      color = `${Markup.codestring(intToHex(role.color, true))} ${Markup.codestring(`(${rgb.r}, ${rgb.g}, ${rgb.b})`)}`;
    }

    let position = role.position.toLocaleString(language);
    if (role.guild) {
      const index = role.guild.roles.sort((x, y) => x.position - y.position).findIndex((r) => r.id === role.id) + 1;
      position += ` (${index.toLocaleString(language)}/${role.guild.roles.length.toLocaleString(language)})`;
    }

    lines.push(displayDetailsLine([
      (color) && displayDetail(translate('info.role.color'), color),
      displayDetail(translate('common.position'), position),
      displayDetail(translate('counts.members'), role.members.length.toLocaleString(language)),
    ]));
  }

  if (role.tags) {
    let type: string;
    if (role.isBoosterRole) {
      type = translate('info.role.booster_role');
    } else if (role.botId) {
      type = translate('info.role.bot_role', {bot: `<@${role.botId}>`});
    } else if (role.subscriptionListingId) {
      type = translate('info.role.subscription_role', {id: role.subscriptionListingId});
    } else if (role.tags.guildConnections) {
      type = translate('info.role.linked_role');
    } else if (role.integrationId) {
      type = translate('info.role.integration_role', {id: String(role.integrationId)});
    } else {
      type = translate('common.unknown_value', {value: JSON.stringify(role.tags)});
    }
    lines.push(displayDetail(translate('common.type'), type));
  }

  // only the ones that are on
  lines.push(displayDetailsLine([
    (role.isDefault) && displayDetail(translate('info.role.default_role'), translate('common.yes')),
    (role.hoist) && displayDetail(translate('info.role.hoisted'), translate('common.yes')),
    (role.managed) && displayDetail(translate('common.managed'), translate('common.yes')),
    (role.mentionable) && displayDetail(translate('info.role.mentionable'), translate('common.yes')),
  ]));

  // the moderation permissions the role itself gives, the rest (and per channel) is `/info permissions`
  {
    let moderation: string;
    if (PermissionTools.checkPermissions(role.permissions, Permissions.ADMINISTRATOR)) {
      moderation = label('permissions', PermissionsText[String(Permissions.ADMINISTRATOR)]);
    } else {
      const names = PERMISSIONS_ADMIN
        .filter((permission) => PermissionTools.checkPermissions(role.permissions, permission))
        .map((permission) => label('permissions', PermissionsText[String(permission)]));
      moderation = (names.length) ? names.join(', ') : translate('common.none');
    }
    lines.push(displayDetail(translate('info.role.moderation'), moderation));
    lines.push(`-# ${translate('info.role.permissions_hint', {command: slashCommandMention(context, 'info permissions')})}`);
  }

  lines.push(displayDetailsLine([
    displayDetail(translate('common.created'), displayTimestamp(role.createdAt)),
    displayDetail(translate('common.id'), Markup.codestring(role.id)),
  ], true));

  payload.description = displayDetails(lines);

  return displayReply(context, payload);
}
