import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions, PERMISSIONS_ALL } from 'detritus-client/lib/constants';
import { Markup, PermissionTools } from 'detritus-client/lib/utils';

import {
  PermissionsText,
  PERMISSIONS_ADMIN,
  PERMISSIONS_TEXT,
  PERMISSIONS_VOICE,
  StatusEmojis,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayReply,
} from '../../../utils';


export type Target = Structures.Member | Structures.Role;

export interface CommandArgsBefore {
  channel: Structures.Channel | null,
  server?: boolean,
  target: Structures.Member | Structures.Role | Structures.User | null,
}

export interface CommandArgs {
  channel: Structures.Channel,
  server?: boolean,
  target: Target,
}


export const COMMAND_ID = 'info.permissions';

// timed out members keep only these, everything else is denied everywhere until it ends
const PERMISSIONS_TIMED_OUT = Permissions.VIEW_CHANNEL | Permissions.READ_MESSAGE_HISTORY;

// what isn't moderation/text/voice (change nickname, create events/expressions...), only shown for the server
const PERMISSIONS_GENERAL = Object.freeze(
  Object.values(Permissions).filter((permission) => {
    return (
      permission !== Permissions.NONE &&
      String(permission) in PermissionsText &&
      !PERMISSIONS_ADMIN.includes(permission) &&
      !PERMISSIONS_TEXT.includes(permission) &&
      !PERMISSIONS_VOICE.includes(permission)
    );
  }),
);

// every permission we have a name for, in the order the groups list them, for the allowed/denied here lines
const PERMISSIONS_NAMED = Object.freeze(
  Array.from(new Set([...PERMISSIONS_ADMIN, ...PERMISSIONS_GENERAL, ...PERMISSIONS_TEXT, ...PERMISSIONS_VOICE])),
);


// the interaction's resolved member carries its permissions in the invoking channel, which `member.permissions` would
// return as if it were the server-wide total, so the cached member (or the raw roles) is used instead
export function getCachedMember(context: Command.Context | Interaction.InteractionContext, member: Structures.Member): Structures.Member {
  const { guild } = context;
  return (guild && guild.members.get(member.id)) || member;
}

// threads have no overwrites of their own, they use their parent's
function getOverwriteChannel(channel: Structures.Channel): Structures.Channel {
  return (channel.isGuildThread && channel.parent) || channel;
}

// someone can only look at a channel they can see themselves, so the command can't be used to find out about hidden ones
export function canViewChannel(context: Command.Context | Interaction.InteractionContext, channel: Structures.Channel): boolean {
  if (!context.member || channel.guildId !== context.guildId) {
    return false;
  }
  return channel.can(Permissions.VIEW_CHANNEL, getCachedMember(context, context.member));
}


interface Computed {
  administrator: boolean,
  owner: boolean,
  server: bigint,
  channel: bigint | null,
  overwrites: Array<string>,
  timedOutUntil: number,
}

function computeMember(guild: Structures.Guild, member: Structures.Member, channel: Structures.Channel | null): Computed {
  const owner = guild.isOwner(member.id);

  let server: bigint = Permissions.NONE;
  if (owner) {
    server = PERMISSIONS_ALL;
  } else {
    const everyone = guild.defaultRole;
    if (everyone) {
      server |= everyone.permissions;
    }
    for (let roleId of member._roles || []) {
      const role = guild.roles.get(roleId);
      if (role) {
        server |= role.permissions;
      }
    }
  }
  const administrator = owner || PermissionTools.checkPermissions(server, Permissions.ADMINISTRATOR);

  let timedOutUntil = 0;
  if (!administrator && member.communicationDisabledUntilUnix && Date.now() < member.communicationDisabledUntilUnix) {
    timedOutUntil = member.communicationDisabledUntilUnix;
  }

  let permissions: bigint | null = null;
  const overwrites: Array<string> = [];
  if (channel && !administrator) {
    const overwriteChannel = getOverwriteChannel(channel);
    // the starting permissions skip detritus' administrator check, we did that above
    permissions = member.permissionsIn(overwriteChannel, server);
    // in the order discord applies them: @everyone, the member's roles, then the member
    if (overwriteChannel.permissionOverwrites.has(guild.id)) {
      overwrites.push('@everyone');
    }
    for (let roleId of member._roles || []) {
      if (roleId !== guild.id && overwriteChannel.permissionOverwrites.has(roleId)) {
        overwrites.push(`<@&${roleId}>`);
      }
    }
    if (overwriteChannel.permissionOverwrites.has(member.id)) {
      overwrites.push(member.mention);
    }
  }

  if (timedOutUntil) {
    server &= PERMISSIONS_TIMED_OUT;
    if (permissions !== null) {
      permissions &= PERMISSIONS_TIMED_OUT;
    }
  }

  return {administrator, owner, server, channel: permissions, overwrites, timedOutUntil};
}

function computeRole(guild: Structures.Guild, role: Structures.Role, channel: Structures.Channel | null): Computed {
  let server = role.permissions;
  const everyone = guild.defaultRole;
  if (everyone) {
    server |= everyone.permissions;
  }
  const administrator = PermissionTools.checkPermissions(server, Permissions.ADMINISTRATOR);

  let permissions: bigint | null = null;
  const overwrites: Array<string> = [];
  if (channel && !administrator) {
    const overwriteChannel = getOverwriteChannel(channel);
    permissions = role.permissionsIn(overwriteChannel as Structures.ChannelGuildBase, {ignoreAdministrator: true});
    if (!role.isDefault && overwriteChannel.permissionOverwrites.has(guild.id)) {
      overwrites.push('@everyone');
    }
    if (overwriteChannel.permissionOverwrites.has(role.id)) {
      overwrites.push((role.isDefault) ? '@everyone' : role.mention);
    }
  }

  return {administrator, owner: false, server, channel: permissions, overwrites, timedOutUntil: 0};
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { label, translate } = await getTranslator(context);
  const guild = context.guild as Structures.Guild;

  const { target } = args;
  const channel = (args.server) ? null : args.channel;

  const isRole = target instanceof Structures.Role;
  const computed = (isRole) ? computeRole(guild, target, channel) : computeMember(guild, target, channel);
  const mention = (isRole && target.isDefault) ? '@everyone' : target.mention;

  const payload: DisplayPayload = {};
  if (isRole) {
    payload.title = target.name;
    if (target.color) {
      payload.color = target.color;
    }
  } else {
    payload.title = target.name;
    payload.thumbnail = target.avatarUrlFormat(null, {size: 256});
    // the color of their highest colored role, like their name in the member list
    if (target.color) {
      payload.color = target.color;
    }
  }

  const lines: Array<string> = [];
  if (channel) {
    lines.push(translate('info.permissions.description_channel', {target: mention, channel: channel.mention}));
  } else {
    lines.push(translate('info.permissions.description_server', {target: mention}));
  }

  const names = (permissions: bigint, list: ReadonlyArray<bigint>): Array<string> => {
    return list
      .filter((permission) => PermissionTools.checkPermissions(permissions, permission))
      .map((permission) => label('permissions', PermissionsText[String(permission)]));
  };
  const allowed = (permissions: bigint, list: ReadonlyArray<bigint>): string => {
    const found = names(permissions, list);
    return (found.length) ? found.join(', ') : translate('common.none');
  };

  if (computed.owner) {
    lines.push(`${StatusEmojis.YES} ${translate('info.permissions.owner')}`);
  } else if (computed.administrator) {
    lines.push(`${StatusEmojis.YES} ${translate('info.permissions.administrator')}`);
  } else {
    if (computed.timedOutUntil) {
      const until = translate('permcheck.until', {time: Markup.timestamp(computed.timedOutUntil)});
      lines.push(`${StatusEmojis.WARNING} ${displayDetail(translate('info.permissions.timed_out'), until)}`);
    }

    if (channel && computed.channel !== null) {
      const permissions = computed.channel;
      lines.push(displayDetail(translate('info.role.moderation'), allowed(permissions, PERMISSIONS_ADMIN)));
      // voice channels have a text chat too, categories and forums show both since their overwrites cover both
      const showText = channel.isText || !channel.isVoice;
      const showVoice = channel.isVoice || channel.isGuildCategory;
      if (showText) {
        lines.push(displayDetail(translate('info.role.text'), allowed(permissions, PERMISSIONS_TEXT)));
      }
      if (showVoice) {
        lines.push(displayDetail(translate('info.role.voice'), allowed(permissions, PERMISSIONS_VOICE)));
      }

      // what this channel's overwrites changed from the server-wide permissions, the "why can't they" part
      const added = names(permissions & ~computed.server, PERMISSIONS_NAMED);
      const removed = names(computed.server & ~permissions, PERMISSIONS_NAMED);
      if (added.length) {
        lines.push(displayDetail(translate('info.permissions.allowed_here'), added.join(', ')));
      }
      if (removed.length) {
        lines.push(displayDetail(translate('info.permissions.denied_here'), removed.join(', ')));
      }
    } else {
      const permissions = computed.server;
      lines.push(displayDetail(translate('info.role.moderation'), allowed(permissions, PERMISSIONS_ADMIN)));
      lines.push(displayDetail(translate('info.permissions.general'), allowed(permissions, PERMISSIONS_GENERAL)));
      lines.push(displayDetail(translate('info.role.text'), allowed(permissions, PERMISSIONS_TEXT)));
      lines.push(displayDetail(translate('info.role.voice'), allowed(permissions, PERMISSIONS_VOICE)));
    }
  }

  // the overwrites that applied, administrators skip them
  if (channel && computed.channel !== null) {
    lines.push(displayDetailsLine([
      displayDetail(translate('counts.overwrites'), (computed.overwrites.length) ? computed.overwrites.join(', ') : translate('common.none')),
    ], true));
  }

  payload.description = displayDetails(lines);

  return displayReply(context, payload);
}
