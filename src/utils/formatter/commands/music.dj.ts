import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { displayDetails, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.dj';
export const COMMAND_ID_ROLE = 'music.dj.role';

// what `music dj role` makes (and saves as the dj role): no permissions, at the bottom of the list (where new roles go)
const ROLE_NAME = 'NotSoMusic';

export interface CommandArgs {
  // null shows it
  enabled: boolean | null,
}

// dj mode, a server setting (on by default): controlling the music (skip, pause, resume, seek, loop, leave, moving
// others' tracks, the buttons) needs manage server or the dj role (`canManageMusic`), no votes. Anyone can still queue.
// Changing it needs a dj too
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let enabled: boolean;
  if (args.enabled === null) {
    enabled = (await fetchGuildMusic(context, guildId)).dj_only;
  } else {
    if (!canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
    }
    enabled = (await editGuildMusic(context, guildId, {djOnly: args.enabled})).dj_only;
  }
  return displayReply(context, {
    description: displayDetails([
      translate((enabled) ? 'music_dj.on' : 'music_dj.off'),
      (enabled) ? `-# ${translate('music_dj.explanation')}` : null,
    ]),
  });
}


export interface RoleArgs {
  // clears the picked role (roles named "notsomusic" count again)
  clear?: boolean,
  // makes this the dj role. Nothing given shows the picked one, or makes one
  role?: null | Structures.Role,
}

// the dj role: `role` saves that one, `clear` forgets it, nothing given shows the saved one or (none saved, or it was
// deleted) saves a role named "notsomusic" if there is one or makes one (no permissions, at the bottom of the list,
// where new roles go). Picking needs manage server, making one manage roles too (us as well)
export async function createRoleMessage(context: Command.Context | Interaction.InteractionContext, args: RoleArgs = {}) {
  const { translate } = await getTranslator(context);
  const warn = (description: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`});

  const guild = context.guild;
  if (!guild) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const settings = await GuildSettingsStore.getOrFetch(context, guild.id);
  const savedId = (settings && settings.settings) ? settings.settings.musicDjRoleId : null;
  const saved = (savedId) ? guild.roles.get(savedId) : undefined;
  const member = context.member;
  const canPick = !!member && (member.isOwner || member.can(Permissions.MANAGE_GUILD));

  // saved for this cluster right away, the api sends everyone the settings again too
  const save = async (roleId: null | string) => {
    await editGuildMusic(context, guild.id, {djRoleId: roleId});
    if (settings && settings.settings) {
      settings.settings.musicDjRoleId = roleId;
    }
  };
  const role = (id: string) => ({role: `<@&${id}>`});

  if (args.clear || args.role) {
    if (!canPick) {
      return warn(translate('music_dj.role_set_no_permission'));
    }
    if (args.clear) {
      await save(null);
      return displayReply(context, {description: translate('music_dj.role_cleared')});
    }
    if (args.role!.id === guild.id) {
      return warn(translate('music_dj.role_everyone'));
    }
    await save(args.role!.id);
    return displayReply(context, {description: translate('music_dj.role_set', role(args.role!.id))});
  }

  if (saved) {
    return displayReply(context, {description: translate('music_dj.role_current', role(saved.id))});
  }
  if (!canPick) {
    return warn(translate('music_dj.role_set_no_permission'));
  }
  // one named like it already, it's saved instead of making another
  const named = guild.roles.find((x) => x.name.toLowerCase().includes('notsomusic'));
  if (named) {
    await save(named.id);
    return displayReply(context, {description: translate('music_dj.role_set', role(named.id))});
  }
  if (!member || !(member.isOwner || member.can(Permissions.MANAGE_ROLES))) {
    return warn(translate('music_dj.role_no_permission'));
  }
  const me = guild.me;
  if (!me || !me.can(Permissions.MANAGE_ROLES)) {
    return warn(translate('music_dj.role_bot_no_permission'));
  }
  const created = await context.rest.createGuildRole(guild.id, {
    hoist: false,
    mentionable: false,
    name: ROLE_NAME,
    permissions: '0',
    reason: `music dj role, by ${context.user} (${context.userId})`,
  });
  await save(created.id);
  return displayReply(context, {description: translate('music_dj.role_created', role(created.id))});
}
